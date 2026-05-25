import { NextResponse } from "next/server";
import { FootballApiError, fetchFootballData } from "@/lib/footballDataApi";
import { checkRateLimit } from "@/lib/security";

type EndpointKey =
  | "todayMatches"
  | "competitionMatches"
  | "standings"
  | "scorers"
  | "competitionTeams"
  | "teamMatches"
  | "competitions"
  | "areas";

const COMPETITION_FILTERS = ["dateFrom", "dateTo", "stage", "status", "matchday", "group", "season"] as const;
const STANDINGS_FILTERS = ["matchday", "season", "date"] as const;
const SCORERS_FILTERS = ["limit", "season"] as const;
const TEAM_MATCH_FILTERS = ["dateFrom", "dateTo", "season", "competitions", "status", "venue", "limit"] as const;

function isDateValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function pickAllowedParams(search: URLSearchParams, keys: readonly string[]) {
  const params: Record<string, string> = {};
  for (const key of keys) {
    const value = search.get(key)?.trim();
    if (!value) continue;
    if ((key === "dateFrom" || key === "dateTo" || key === "date") && !isDateValue(value)) continue;
    params[key] = value;
  }
  return params;
}

function getCompetitionCode(search: URLSearchParams) {
  const competition = search.get("competition")?.trim().toUpperCase() || "";
  return /^[A-Z0-9_]{2,10}$/.test(competition) ? competition : "";
}

function getTeamId(search: URLSearchParams) {
  const raw = search.get("teamId")?.trim() || "";
  return /^\d+$/.test(raw) ? raw : "";
}

export async function GET(req: Request) {
  const rateLimit = checkRateLimit(req, "football-data-api", 40, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const { searchParams } = new URL(req.url);
  const endpoint = (searchParams.get("endpoint") || "").trim() as EndpointKey;

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint parameter." }, { status: 400 });
  }

  try {
    let path = "";
    let params: Record<string, string> = {};
    let cacheTtlMs = 45_000;

    switch (endpoint) {
      case "todayMatches":
        path = "/matches";
        params = pickAllowedParams(searchParams, ["competitions", "ids", "dateFrom", "dateTo", "status"]);
        cacheTtlMs = 20_000;
        break;
      case "competitionMatches": {
        const competition = getCompetitionCode(searchParams);
        if (!competition) {
          return NextResponse.json({ error: "Valid competition code is required." }, { status: 400 });
        }
        path = `/competitions/${competition}/matches`;
        params = pickAllowedParams(searchParams, COMPETITION_FILTERS);
        cacheTtlMs = 35_000;
        break;
      }
      case "standings": {
        const competition = getCompetitionCode(searchParams);
        if (!competition) {
          return NextResponse.json({ error: "Valid competition code is required." }, { status: 400 });
        }
        path = `/competitions/${competition}/standings`;
        params = pickAllowedParams(searchParams, STANDINGS_FILTERS);
        cacheTtlMs = 90_000;
        break;
      }
      case "scorers": {
        const competition = getCompetitionCode(searchParams);
        if (!competition) {
          return NextResponse.json({ error: "Valid competition code is required." }, { status: 400 });
        }
        path = `/competitions/${competition}/scorers`;
        params = pickAllowedParams(searchParams, SCORERS_FILTERS);
        cacheTtlMs = 120_000;
        break;
      }
      case "competitionTeams": {
        const competition = getCompetitionCode(searchParams);
        if (!competition) {
          return NextResponse.json({ error: "Valid competition code is required." }, { status: 400 });
        }
        path = `/competitions/${competition}/teams`;
        params = pickAllowedParams(searchParams, ["season"]);
        cacheTtlMs = 120_000;
        break;
      }
      case "teamMatches": {
        const teamId = getTeamId(searchParams);
        if (!teamId) {
          return NextResponse.json({ error: "Valid numeric teamId is required." }, { status: 400 });
        }
        path = `/teams/${teamId}/matches`;
        params = pickAllowedParams(searchParams, TEAM_MATCH_FILTERS);
        cacheTtlMs = 35_000;
        break;
      }
      case "competitions":
        path = "/competitions";
        params = pickAllowedParams(searchParams, ["areas"]);
        cacheTtlMs = 180_000;
        break;
      case "areas":
        path = "/areas";
        params = {};
        cacheTtlMs = 180_000;
        break;
      default:
        return NextResponse.json({ error: "Unsupported endpoint." }, { status: 400 });
    }

    const result = await fetchFootballData({ path, params, cacheTtlMs });
    return NextResponse.json({
      endpoint,
      path,
      params,
      quota: {
        remaining: result.remaining,
        resetAt: result.resetAt,
        cached: result.cached,
      },
      data: result.payload,
    });
  } catch (error) {
    if (error instanceof FootballApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to fetch football data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
