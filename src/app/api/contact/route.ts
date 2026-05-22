import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, message } = body;
  if (!name || !email || !message) return NextResponse.json({ error: "All fields required" }, { status: 400 });
  const supabase = await createAdminClient();
  const { error } = await supabase.from("contacts").insert({ name, email, message });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
