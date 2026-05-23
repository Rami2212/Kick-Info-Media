type PrimitiveParam = string | number;

type FetchFootballDataOptions = {
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

export type FootballDataResult = {
  payload: unknown;
  cached: boolean;
  remaining: number;
  resetAt: number;
};

export class FootballApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

const BASE_URL = "https://api.football-data.org/v4";
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

function getApiToken(): string {
  const token = process.env.FOOTBALL_DATA_API_TOKEN || process.env.FOOTBALL_DATA_API_KEY;
  if (!token) {
    throw new FootballApiError(
      "Missing FOOTBALL_DATA_API_TOKEN (or FOOTBALL_DATA_API_KEY) environment variable.",
      500,
    );
  }
  return token;
}

function getBucketState(): { remaining: number; resetAt: number } {
  const now = nowMs();
  if (apiBucket.resetAt <= now) {
    return { remaining: API_LIMIT_PER_MINUTE, resetAt: now + API_WINDOW_MS };
  }
  return {
    remaining: Math.max(0, API_LIMIT_PER_MINUTE - apiBucket.count),
    resetAt: apiBucket.resetAt,
  };
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
    throw new FootballApiError(
      `Football API quota reached (10 calls/min). Try again in ${retrySeconds}s.`,
      429,
    );
  }

  apiBucket.count += 1;
}

function buildKey(path: string, params: Record<string, PrimitiveParam | undefined>) {
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

export async function fetchFootballData({
  path,
  params = {},
  cacheTtlMs = CACHE_TTL_MS_DEFAULT,
}: FetchFootballDataOptions): Promise<FootballDataResult> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const key = buildKey(normalizedPath, params);
  const now = nowMs();

  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > now) {
    const bucket = getBucketState();
    return {
      payload: cached.payload,
      cached: true,
      remaining: bucket.remaining,
      resetAt: bucket.resetAt,
    };
  }

  consumeGlobalMinuteQuota();
  const token = getApiToken();
  const url = new URL(`${BASE_URL}${normalizedPath}`);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, String(v));
  }

  const response = await fetch(url.toString(), {
    headers: {
      "X-Auth-Token": token,
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: unknown }).message || "Football API request failed")
        : typeof body === "string" && body.trim().length > 0
          ? body
          : "Football API request failed";
    throw new FootballApiError(message, response.status);
  }

  responseCache.set(key, {
    payload: body,
    expiresAt: now + cacheTtlMs,
  });

  const bucket = getBucketState();
  return {
    payload: body,
    cached: false,
    remaining: bucket.remaining,
    resetAt: bucket.resetAt,
  };
}
