function normalizeBaseUrl(value: string): string {
  const input = value.trim();
  if (!input) return "";

  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function getSiteBaseUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.NEXTAUTH_URL,
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const normalized = normalizeBaseUrl(raw);
    if (normalized) return normalized;
  }

  return "http://localhost:3000";
}
