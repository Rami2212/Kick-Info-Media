import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { checkRateLimit, enforceSameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const rateLimit = checkRateLimit(req, "profiles-batch", 40, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many profile lookups. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { usernames?: unknown };
    const input = Array.isArray(body.usernames) ? body.usernames : [];

    const usernames = [...new Set(
      input
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean),
    )].slice(0, 200);

    if (usernames.length === 0) {
      return NextResponse.json({ profiles: {}, registeredUsernames: [] });
    }

    const db = await getMongoDb();
    const users = await db
      .collection("users")
      .find(
        { username: { $in: usernames } },
        { projection: { username: 1, profileImageUrl: 1 } },
      )
      .toArray();

    const profiles: Record<string, string> = {};
    const registeredUsernames: string[] = [];
    users.forEach((user) => {
      const username = typeof user.username === "string" ? user.username : "";
      const profileImageUrl = typeof user.profileImageUrl === "string" ? user.profileImageUrl : "";
      if (!username) return;
      registeredUsernames.push(username);
      if (profileImageUrl) {
        profiles[username] = profileImageUrl;
      }
    });

    return NextResponse.json({ profiles, registeredUsernames });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profiles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
