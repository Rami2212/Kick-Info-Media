export type NextMatchStatTeam = {
  name: string;
  flagImageUrl: string;
  goals: number;
};

export type NextMatchStatRow = {
  label: string;
  home: string;
  away: string;
};

export type NextMatchStatData = {
  title: string;
  subtitle: string;
  kickoff: string;
  status: string;
  venue: string;
  home: NextMatchStatTeam;
  away: NextMatchStatTeam;
  stats: NextMatchStatRow[];
};

export const DEFAULT_NEXT_MATCH_STATS_DATA: NextMatchStatData = {
  title: "Next Match Stat",
  subtitle: "Manual match stats from Site Settings.",
  kickoff: "2026-06-11 20:30",
  status: "Upcoming",
  venue: "Mexico City",
  home: {
    name: "France",
    flagImageUrl: "https://flagcdn.com/w80/fr.png",
    goals: 2,
  },
  away: {
    name: "Brazil",
    flagImageUrl: "https://flagcdn.com/w80/br.png",
    goals: 1,
  },
  stats: [
    { label: "Possession", home: "54%", away: "46%" },
    { label: "Shots", home: "14", away: "10" },
    { label: "Shots On Target", home: "6", away: "4" },
    { label: "Corners", home: "5", away: "3" },
    { label: "Fouls", home: "12", away: "15" },
  ],
};

export const DEFAULT_NEXT_MATCH_STATS_JSON = JSON.stringify(DEFAULT_NEXT_MATCH_STATS_DATA, null, 2);

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeGoals(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed));
    }
  }

  return fallback;
}

function parseTeam(value: unknown, fallback: NextMatchStatTeam): NextMatchStatTeam {
  if (!value || typeof value !== "object") {
    return { ...fallback };
  }

  const team = value as { name?: unknown; flagImageUrl?: unknown; goals?: unknown };

  return {
    name: normalizeText(team.name) || fallback.name,
    flagImageUrl: normalizeText(team.flagImageUrl) || fallback.flagImageUrl,
    goals: normalizeGoals(team.goals, fallback.goals),
  };
}

function parseStats(value: unknown, fallback: NextMatchStatRow[]): NextMatchStatRow[] {
  if (!Array.isArray(value)) {
    return fallback.map((row) => ({ ...row }));
  }

  const parsed = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { label?: unknown; home?: unknown; away?: unknown };
      const label = normalizeText(row.label);
      const home = normalizeText(row.home);
      const away = normalizeText(row.away);
      if (!label) return null;
      return { label, home, away };
    })
    .filter((row): row is NextMatchStatRow => !!row)
    .slice(0, 20);

  if (parsed.length === 0) {
    return fallback.map((row) => ({ ...row }));
  }

  return parsed;
}

function cloneData(value: NextMatchStatData): NextMatchStatData {
  return {
    ...value,
    home: { ...value.home },
    away: { ...value.away },
    stats: value.stats.map((row) => ({ ...row })),
  };
}

export function parseNextMatchStatsData(value: unknown): NextMatchStatData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as {
    title?: unknown;
    subtitle?: unknown;
    kickoff?: unknown;
    status?: unknown;
    venue?: unknown;
    home?: unknown;
    away?: unknown;
    stats?: unknown;
  };

  const fallback = DEFAULT_NEXT_MATCH_STATS_DATA;

  return {
    title: normalizeText(raw.title) || fallback.title,
    subtitle: normalizeText(raw.subtitle) || fallback.subtitle,
    kickoff: normalizeText(raw.kickoff) || fallback.kickoff,
    status: normalizeText(raw.status) || fallback.status,
    venue: normalizeText(raw.venue) || fallback.venue,
    home: parseTeam(raw.home, fallback.home),
    away: parseTeam(raw.away, fallback.away),
    stats: parseStats(raw.stats, fallback.stats),
  };
}

export function parseNextMatchStatsJsonText(value: string): NextMatchStatData | null {
  const text = normalizeText(value);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as unknown;
    return parseNextMatchStatsData(parsed);
  } catch {
    return null;
  }
}

export function getDefaultNextMatchStatsData(): NextMatchStatData {
  return cloneData(DEFAULT_NEXT_MATCH_STATS_DATA);
}
