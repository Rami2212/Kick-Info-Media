export type RankingRow = {
  rank: number;
  team: string;
  code: string;
  points: number;
};

export type RankingsData = {
  men: RankingRow[];
  women: RankingRow[];
};

const DEFAULT_RANKINGS: RankingsData = {
  men: [
    { rank: 1, team: "France", code: "fr", points: 1877.32 },
    { rank: 2, team: "Spain", code: "es", points: 1876.4 },
    { rank: 3, team: "Argentina", code: "ar", points: 1874.81 },
    { rank: 4, team: "England", code: "gb-eng", points: 1825.97 },
    { rank: 5, team: "Portugal", code: "pt", points: 1763.83 },
    { rank: 6, team: "Brazil", code: "br", points: 1761.16 },
    { rank: 7, team: "Netherlands", code: "nl", points: 1757.87 },
    { rank: 8, team: "Morocco", code: "ma", points: 1755.87 },
    { rank: 9, team: "Belgium", code: "be", points: 1734.71 },
    { rank: 10, team: "Germany", code: "de", points: 1730.37 },
  ],
  women: [
    { rank: 1, team: "Spain", code: "es", points: 2083.09 },
    { rank: 2, team: "USA", code: "us", points: 2054.65 },
    { rank: 3, team: "England", code: "gb-eng", points: 2038.72 },
    { rank: 4, team: "Germany", code: "de", points: 2021.78 },
    { rank: 5, team: "Japan", code: "jp", points: 2011.27 },
    { rank: 6, team: "Brazil", code: "br", points: 1980.0 },
    { rank: 7, team: "France", code: "fr", points: 1975.6 },
    { rank: 8, team: "Sweden", code: "se", points: 1961.22 },
    { rank: 9, team: "Canada", code: "ca", points: 1934.88 },
    { rank: 10, team: "Netherlands", code: "nl", points: 1929.32 },
  ],
};

const TEAM_TO_FLAG_CODE: Record<string, string> = {
  france: "fr",
  spain: "es",
  argentina: "ar",
  england: "gb-eng",
  portugal: "pt",
  brazil: "br",
  netherlands: "nl",
  morocco: "ma",
  belgium: "be",
  germany: "de",
  usa: "us",
  japan: "jp",
  sweden: "se",
  canada: "ca",
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function resolveFlagCode(team: string): string {
  const key = team.trim().toLowerCase();
  if (!key) return "un";
  return TEAM_TO_FLAG_CODE[key] || "un";
}

function parseRow(value: unknown): RankingRow | null {
  if (!value || typeof value !== "object") return null;
  const input = value as { rank?: unknown; team?: unknown; code?: unknown; points?: unknown };

  const rank = normalizeNumber(input.rank);
  const points = normalizeNumber(input.points);
  const team = normalizeText(input.team);
  const code = normalizeText(input.code).toLowerCase();

  if (rank === null || points === null || !team) return null;

  return {
    rank: Math.max(1, Math.floor(rank)),
    team,
    code: code || resolveFlagCode(team),
    points: Math.max(0, points),
  };
}

function parseRows(value: unknown): RankingRow[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => parseRow(item))
    .filter((item): item is RankingRow => !!item)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 50);
}

function cloneData(data: RankingsData): RankingsData {
  return {
    men: data.men.map((row) => ({ ...row })),
    women: data.women.map((row) => ({ ...row })),
  };
}

export function getDefaultRankingsData(): RankingsData {
  return cloneData(DEFAULT_RANKINGS);
}

export function parseRankingsData(value: unknown): RankingsData | null {
  if (!value || typeof value !== "object") return null;
  const input = value as { men?: unknown; women?: unknown };
  const men = parseRows(input.men);
  const women = parseRows(input.women);
  if (men.length === 0 || women.length === 0) return null;
  return { men, women };
}

export function parseRankingsJsonText(value: string): RankingsData | null {
  const text = normalizeText(value);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as unknown;
    return parseRankingsData(parsed);
  } catch {
    return null;
  }
}

export function formatRankingsJson(data: RankingsData): string {
  return JSON.stringify(data, null, 2);
}

export const DEFAULT_RANKINGS_JSON = JSON.stringify(
  {
    men: DEFAULT_RANKINGS.men.map(({ rank, team, points }) => ({ rank, team, points })),
    women: DEFAULT_RANKINGS.women.map(({ rank, team, points }) => ({ rank, team, points })),
  },
  null,
  2,
);
