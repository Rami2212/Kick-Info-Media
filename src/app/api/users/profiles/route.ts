import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
