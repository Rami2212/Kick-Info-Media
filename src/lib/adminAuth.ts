import { createClient } from "@/lib/supabase/server";

export type AdminAuthResult = {
  ok: boolean;
  email: string;
};

function parseCsv(value: string | undefined): string[] {
  return (value || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdminAuth(): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, email: "" };

  const email = String(user.email || "").trim().toLowerCase();
  if (!email) return { ok: false, email: "" };

  const adminEmails = parseCsv(process.env.ADMIN_EMAILS);
  if (adminEmails.length === 0) {
    // Backward-compatible fallback if allowlist is not configured.
    return { ok: true, email };
  }

  return { ok: adminEmails.includes(email), email };
}

