import { fetchFootballData } from "@/lib/footballDataApi";

type PrimitiveParam = string | number;

type ApiSportsRequestOptions = {
  path: string;
  params?: Record<string, PrimitiveParam | undefined>;
  cacheTtlMs?: number;
};

type CacheEntry = {
  expiresAt: number;
  payload: unknown;
};

type ApiBucket = {
  count: number;
  resetAt: number;
};

type ApiSportsFixtureTeam = {
  id?: number;
  name?: string;
  logo?: string;
};

type ApiSportsFixtureEntry = {
  fixture?: {
    id?: number;
    date?: string;
    status?: {
      long?: string;
    };
    venue?: {
      name?: string;
      city?: string;
    };
  };
  league?: {
    round?: string;
  };
  teams?: {
    home?: ApiSportsFixtureTeam;
    away?: ApiSportsFixtureTeam;
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
};

type ApiSportsStatisticsEntry = {
  team?: {
    id?: number;
  };
  statistics?: Array<{
    type?: string;
    value?: unknown;
  }>;
};

type ApiSportsEnvelope<TResponse> = {
  errors?: unknown;
  response?: TResponse;
};

type FootballDataTeam = {
  name?: string;
  crest?: string;
};

type FootballDataMatch = {
  utcDate?: string;
  status?: string;
  stage?: string;
  matchday?: number;
  venue?: string | null;
  homeTeam?: FootballDataTeam;
  awayTeam?: FootballDataTeam;
  score?: {
    fullTime?: {
      home?: number | null;
      away?: number | null;
    };
  };
};

type FootballDataCompetitionMatchesPayload = {
  matches?: FootballDataMatch[];
};

export type ApiSportsMatchStatRow = {
  label: string;
  home: string;
  away: string;
};

export type ApiSportsNextMatchData = {
  title: string;
  subtitle: string;
  home: {
    name: string;
    flagImageUrl: string;
    goals: string;
  };
  away: {
    name: string;
    flagImageUrl: string;
    goals: string;
  };
  kickoff: string;
  status: string;
  venue: string;
  stats: ApiSportsMatchStatRow[];
};

export class ApiSportsError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

const BASE_URL = "https://v3.football.api-sports.io";
const CACHE_TTL_MS_DEFAULT = 45_000;
const API_LIMIT_PER_MINUTE = 10;
const API_WINDOW_MS = 60_000;

const responseCache = new Map<string, CacheEntry>();
let apiBucket: ApiBucket = {
  count: 0,
  resetAt: 0,
};

function nowMs() {
  return Date.now();
}

function getApiKey(): string {
  const key =
    process.env.API_SPORTS_KEY ||
    process.env.APISPORTS_KEY ||
    process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new ApiSportsError(
      "Missing API_SPORTS_KEY (or APISPORTS_KEY / API_FOOTBALL_KEY) environment variable.",
      500,
    );
  }
  return key;
}

function consumeGlobalMinuteQuota() {
  const now = nowMs();
  if (apiBucket.resetAt <= now) {
    apiBucket = {
      count: 1,
      resetAt: now + API_WINDOW_MS,
    };
    return;
  }

  if (apiBucket.count >= API_LIMIT_PER_MINUTE) {
    const retrySeconds = Math.max(1, Math.ceil((apiBucket.resetAt - now) / 1000));
    throw new ApiSportsError(`API-SPORTS quota reached (10 calls/min). Try again in ${retrySeconds}s.`, 429);
  }

  apiBucket.count += 1;
}

function buildCacheKey(path: string, params: Record<string, PrimitiveParam | undefined>) {
  const query = new URLSearchParams();
  const keys = Object.keys(params).sort();
  for (const key of keys) {
    const value = params[key];
    if (value === undefined || value === null) continue;
    query.set(key, String(value));
  }
  const queryStr = query.toString();
  return queryStr ? `${path}?${queryStr}` : path;
}

async function fetchApiSports<TPayload = unknown>({
  path,
  params = {},
  cacheTtlMs = CACHE_TTL_MS_DEFAULT,
}: ApiSportsRequestOptions): Promise<TPayload> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const key = buildCacheKey(normalizedPath, params);
  const now = nowMs();

  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.payload as TPayload;
  }

  consumeGlobalMinuteQuota();
  const apiKey = getApiKey();
  const url = new URL(`${BASE_URL}${normalizedPath}`);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, String(v));
  }

  const response = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: unknown }).message || "API-SPORTS request failed")
        : typeof body === "string" && body.trim().length > 0
          ? body
          : "API-SPORTS request failed";
    throw new ApiSportsError(message, response.status);
  }

  responseCache.set(key, {
    payload: body,
    expiresAt: now + cacheTtlMs,
  });

  return body as TPayload;
}

function formatKickoffUtc(dateIso?: string): string {
  if (!dateIso) return "TBD";
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "TBD";

  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);

  return `${formatted} UTC`;
}

function normalizeStatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    const clean = value.trim();
    return clean.length > 0 ? clean : "-";
  }
  return "-";
}

function extractApiErrors(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0);
  }

  if (typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>)
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0);
  }

  if (typeof raw === "string") {
    const text = raw.trim();
    return text ? [text] : [];
  }

  return [];
}

function getStatValue(
  statsEntry: ApiSportsStatisticsEntry | undefined,
  label: string,
): string {
  const list = statsEntry?.statistics || [];
  const item = list.find((row) => (row.type || "").trim().toLowerCase() === label.toLowerCase());
  return normalizeStatValue(item?.value);
}

function parseFixturePayload(payload: ApiSportsEnvelope<ApiSportsFixtureEntry[]> | null | undefined): {
  fixtures: ApiSportsFixtureEntry[];
  errors: string[];
} {
  if (!payload || typeof payload !== "object") {
    return { fixtures: [], errors: [] };
  }

  const fixtures = Array.isArray(payload.response) ? payload.response : [];
  const errors = extractApiErrors(payload.errors);
  return { fixtures, errors };
}

function selectFixture(fixtures: ApiSportsFixtureEntry[], mode: "next" | "latest"): ApiSportsFixtureEntry | null {
  if (fixtures.length === 0) return null;

  const sorted = fixtures
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a.fixture?.date || "").getTime();
      const bTime = new Date(b.fixture?.date || "").getTime();
      const safeA = Number.isNaN(aTime) ? 0 : aTime;
      const safeB = Number.isNaN(bTime) ? 0 : bTime;
      return safeA - safeB;
    });

  if (mode === "latest") {
    return sorted[sorted.length - 1] || null;
  }

  const now = Date.now();
  const upcoming = sorted.find((fixture) => {
    const timestamp = new Date(fixture.fixture?.date || "").getTime();
    return Number.isFinite(timestamp) && timestamp >= now;
  });

  return upcoming || sorted[0] || null;
}

const EMPTY_STATS: ApiSportsMatchStatRow[] = [
  { label: "Shots on Goal", home: "-", away: "-" },
  { label: "Total Shots", home: "-", away: "-" },
  { label: "Ball Possession", home: "-", away: "-" },
  { label: "Passes %", home: "-", away: "-" },
  { label: "Corner Kicks", home: "-", away: "-" },
  { label: "Fouls", home: "-", away: "-" },
];

function selectFootballDataNextMatch(matches: FootballDataMatch[]): FootballDataMatch | null {
  if (matches.length === 0) return null;
  const sorted = matches
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a.utcDate || "").getTime();
      const bTime = new Date(b.utcDate || "").getTime();
      const safeA = Number.isNaN(aTime) ? 0 : aTime;
      const safeB = Number.isNaN(bTime) ? 0 : bTime;
      return safeA - safeB;
    });

  const now = Date.now();
  const upcoming = sorted.find((match) => {
    const timestamp = new Date(match.utcDate || "").getTime();
    return Number.isFinite(timestamp) && timestamp >= now;
  });

  return upcoming || sorted[0] || null;
}

async function getNextFifa2026MatchFromFootballData(): Promise<ApiSportsNextMatchData | null> {
  const scheduledResult = await fetchFootballData({
    path: "/competitions/WC/matches",
    params: {
      status: "SCHEDULED",
    },
    cacheTtlMs: 30_000,
  });

  const scheduledPayload = scheduledResult.payload as FootballDataCompetitionMatchesPayload;
  const nextScheduled = selectFootballDataNextMatch(Array.isArray(scheduledPayload.matches) ? scheduledPayload.matches : []);
  if (!nextScheduled) return null;

  const homeGoals = nextScheduled.score?.fullTime?.home;
  const awayGoals = nextScheduled.score?.fullTime?.away;
  const stage = (nextScheduled.stage || "").trim().replace(/_/g, " ");
  const matchday = nextScheduled.matchday;
  const subtitleBits: string[] = [];
  if (stage) subtitleBits.push(stage);
  if (typeof matchday === "number" && Number.isFinite(matchday)) subtitleBits.push(`Matchday ${matchday}`);
  subtitleBits.push("football-data.org v4");

  return {
    title: "FIFA 2026 - Next Match",
    subtitle: subtitleBits.join(" - "),
    home: {
      name: nextScheduled.homeTeam?.name?.trim() || "Home",
      flagImageUrl: nextScheduled.homeTeam?.crest?.trim() || "",
      goals: homeGoals === null || homeGoals === undefined ? "-" : String(homeGoals),
    },
    away: {
      name: nextScheduled.awayTeam?.name?.trim() || "Away",
      flagImageUrl: nextScheduled.awayTeam?.crest?.trim() || "",
      goals: awayGoals === null || awayGoals === undefined ? "-" : String(awayGoals),
    },
    kickoff: formatKickoffUtc(nextScheduled.utcDate),
    status: (nextScheduled.status || "").trim() || "Scheduled",
    venue: (nextScheduled.venue || "").trim() || "TBD",
    stats: EMPTY_STATS,
  };
}

export async function getNextFifa2026MatchFromApiSports(): Promise<ApiSportsNextMatchData | null> {
  const attemptConfigs: Array<{
    params: Record<string, PrimitiveParam>;
    season: number;
    mode: "next" | "latest";
    fallbackSubtitle?: string;
  }> = [
    {
      params: { league: 1, season: 2026, next: 1, timezone: "UTC" },
      season: 2026,
      mode: "next",
    },
    {
      params: { league: 1, season: 2026, status: "NS", timezone: "UTC" },
      season: 2026,
      mode: "next",
    },
  ];

  let fixture: ApiSportsFixtureEntry | null = null;
  let subtitleFallback = "World Cup fixture (API-SPORTS)";
  let lastApiErrors: string[] = [];

  for (const attempt of attemptConfigs) {
    const payload = await fetchApiSports<ApiSportsEnvelope<ApiSportsFixtureEntry[]>>({
      path: "/fixtures",
      params: attempt.params,
      cacheTtlMs: 30_000,
    });
    const parsed = parseFixturePayload(payload);
    const selected = selectFixture(parsed.fixtures, attempt.mode);
    if (selected) {
      fixture = selected;
      if (attempt.fallbackSubtitle) {
        subtitleFallback = `${attempt.fallbackSubtitle} (season ${attempt.season})`;
      }
      break;
    }
    if (parsed.errors.length > 0) {
      lastApiErrors = parsed.errors;
    }
  }

  if (!fixture) {
    try {
      const footballDataFallback = await getNextFifa2026MatchFromFootballData();
      if (footballDataFallback) {
        return footballDataFallback;
      }
    } catch {
      // no-op: keep API-SPORTS error context if available
    }

    const apiReason = lastApiErrors[0];
    if (apiReason) {
      throw new ApiSportsError(apiReason, 502);
    }
    return null;
  }

  const fixtureId = fixture.fixture?.id;
  const homeTeam = fixture.teams?.home || {};
  const awayTeam = fixture.teams?.away || {};
  const homeGoals = fixture.goals?.home;
  const awayGoals = fixture.goals?.away;
  const venueName = fixture.fixture?.venue?.name?.trim() || "";
  const venueCity = fixture.fixture?.venue?.city?.trim() || "";

  let statsRows: ApiSportsMatchStatRow[] = [];
  if (fixtureId) {
    const statsPayload = await fetchApiSports<ApiSportsEnvelope<ApiSportsStatisticsEntry[]>>({
      path: "/fixtures/statistics",
      params: {
        fixture: fixtureId,
      },
      cacheTtlMs: 30_000,
    });

    const allStats = Array.isArray(statsPayload.response) ? statsPayload.response : [];
    const homeStats = allStats.find((entry) => entry.team?.id === homeTeam.id) || allStats[0];
    const awayStats = allStats.find((entry) => entry.team?.id === awayTeam.id) || allStats[1];

    const labels = [
      "Shots on Goal",
      "Total Shots",
      "Ball Possession",
      "Passes %",
      "Corner Kicks",
      "Fouls",
    ];

    statsRows = labels.map((label) => ({
      label,
      home: getStatValue(homeStats, label),
      away: getStatValue(awayStats, label),
    }));
  }

  if (statsRows.length === 0) {
    statsRows = EMPTY_STATS;
  }

  const roundLabel = fixture.league?.round?.trim() || "";
  const subtitle =
    subtitleFallback !== "World Cup fixture"
      ? roundLabel
        ? `${roundLabel} - ${subtitleFallback}`
        : subtitleFallback
      : roundLabel || subtitleFallback;

  return {
    title: "FIFA 2026 - Next Match",
    subtitle,
    home: {
      name: homeTeam.name?.trim() || "Home",
      flagImageUrl: homeTeam.logo?.trim() || "",
      goals: homeGoals === null || homeGoals === undefined ? "-" : String(homeGoals),
    },
    away: {
      name: awayTeam.name?.trim() || "Away",
      flagImageUrl: awayTeam.logo?.trim() || "",
      goals: awayGoals === null || awayGoals === undefined ? "-" : String(awayGoals),
    },
    kickoff: formatKickoffUtc(fixture.fixture?.date),
    status: fixture.fixture?.status?.long?.trim() || "Scheduled",
    venue: venueName && venueCity ? `${venueName}, ${venueCity}` : venueName || venueCity || "TBD",
    stats: statsRows,
  };
}
