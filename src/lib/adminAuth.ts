import { createClient } from "@/lib/supabase/server";
import { getMongoDb } from "@/lib/mongodb";

export type AdminAuthResult = {
  ok: boolean;
  email: string;
};

export async function requireAdminAuth(): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, email: "" };

  const email = String(user.email || "").trim().toLowerCase();
  if (!email) return { ok: false, email: "" };

  const db = await getMongoDb();
  const dbUser = await db.collection("users").findOne(
    { email },
    { projection: { role: 1 } },
  );

  const role = typeof dbUser?.role === "string" ? dbUser.role.toLowerCase() : "";
  return { ok: role === "admin", email };
}

