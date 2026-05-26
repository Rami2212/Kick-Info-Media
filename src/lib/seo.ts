export const SEO_DEFAULT_DESCRIPTION =
  "The premier destination for breaking football news, tactical analysis, live match coverage, FIFA schedule updates, and fan games.";

export const SEO_DEFAULT_KEYWORDS = [
  "football news",
  "soccer news",
  "FIFA World Cup 2026",
  "match schedule",
  "live match stats",
  "football rankings",
  "KickInfoMedia",
];

export function splitSeoKeywords(value: string | null | undefined): string[] {
  if (!value) return [];

  return value
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mergeSeoKeywords(...groups: Array<string[] | undefined>): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const group of groups) {
    if (!group) continue;
    for (const keyword of group) {
      const normalized = keyword.trim();
      if (!normalized) continue;
      const lookup = normalized.toLowerCase();
      if (seen.has(lookup)) continue;
      seen.add(lookup);
      merged.push(normalized);
    }
  }

  return merged;
}
