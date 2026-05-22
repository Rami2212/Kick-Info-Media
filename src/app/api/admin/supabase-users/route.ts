import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/adminAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await requireAdminAuth();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const emailConfirm = body.email_confirm !== false;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleClient();
    const userMetadata =
      body.user_metadata && typeof body.user_metadata === "object"
        ? (body.user_metadata as Record<string, unknown>)
        : undefined;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: emailConfirm,
      user_metadata: userMetadata,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        id: data.user?.id || "",
        email: data.user?.email || email,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Supabase user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
