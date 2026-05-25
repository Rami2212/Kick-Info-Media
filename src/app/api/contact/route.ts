import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkRateLimit, enforceSameOrigin, isValidEmail } from "@/lib/security";

export async function POST(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const rateLimit = checkRateLimit(req, "contact-form", 6, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many contact submissions. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const message = String(body?.message || "").trim();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (name.length > 120 || message.length > 4000) {
    return NextResponse.json({ error: "Input is too long" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { error } = await supabase.from("contacts").insert({ name, email, message });
  if (error) return NextResponse.json({ error: "Failed to submit contact form" }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
