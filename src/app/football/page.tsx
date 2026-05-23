"use client";

import { useMemo, useState } from "react";

type EndpointKey =
  | "todayMatches"
  | "competitionMatches"
  | "standings"
  | "scorers"
  | "competitionTeams"
  | "teamMatches";

type ApiResponse = {
  error?: string;
  quota?: {
    remaining: number;
    resetAt: number;
    cached: boolean;
  };
  data?: unknown;
};

type MatchView = {
  id: number;
  competition: string;
  utcDate: string;
  status: string;
  home: string;
  away: string;
  score: string;
};

type StandingView = {
  position: number;
  team: string;
  played: number;
  points: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
};

type ScorerView = {
  player: string;
  team: string;
  goals: number;
  assists: number;
  penalties: number;
};

type TeamView = {
  id: number;
  name: string;
  tla: string;
};

const COMPETITIONS = [
  { code: "PL", name: "Premier League" },
  { code: "CL", name: "Champions League" },
  { code: "PD", name: "La Liga" },
  { code: "BL1", name: "Bundesliga" },
  { code: "SA", name: "Serie A" },
  { code: "FL1", name: "Ligue 1" },
];

const STATUS_FILTERS = ["SCHEDULED", "LIVE", "IN_PLAY", "PAUSED", "FINISHED"];

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function mapMatches(payload: unknown): MatchView[] {
  const root = asObject(payload);
  const matches = asArray(root?.matches);

  return matches.map((item) => {
    const row = asObject(item);
    const homeTeam = asObject(row?.homeTeam);
    const awayTeam = asObject(row?.awayTeam);
    const competition = asObject(row?.competition);
    const score = asObject(row?.score);
    const fullTime = asObject(score?.fullTime);

    const homeGoals = fullTime ? fullTime.home : undefined;
    const awayGoals = fullTime ? fullTime.away : undefined;
    const hasGoals = typeof homeGoals === "number" && typeof awayGoals === "number";

    return {
      id: asNumber(row?.id),
      competition: asString(competition?.code) || asString(competition?.name) || "N/A",
      utcDate: asString(row?.utcDate),
      status: asString(row?.status) || "N/A",
      home: asString(homeTeam?.name) || "Home",
      away: asString(awayTeam?.name) || "Away",
      score: hasGoals ? `${homeGoals} - ${awayGoals}` : "-",
    };
  });
}

function mapStandings(payload: unknown): StandingView[] {
  const root = asObject(payload);
  const standings = asArray(root?.standings);
  const firstStanding = asObject(standings[0]);
  const table = asArray(firstStanding?.table);

  return table.map((item) => {
    const row = asObject(item);
    const team = asObject(row?.team);
    return {
      position: asNumber(row?.position),
      team: asString(team?.name) || "Unknown team",
      played: asNumber(row?.playedGames),
      points: asNumber(row?.points),
      won: asNumber(row?.won),
      draw: asNumber(row?.draw),
      lost: asNumber(row?.lost),
      goalsFor: asNumber(row?.goalsFor),
      goalsAgainst: asNumber(row?.goalsAgainst),
    };
  });
}

function mapScorers(payload: unknown): ScorerView[] {
  const root = asObject(payload);
  const scorers = asArray(root?.scorers);

  return scorers.map((item) => {
    const row = asObject(item);
    const player = asObject(row?.player);
    const team = asObject(row?.team);
    return {
      player: asString(player?.name) || "Unknown player",
      team: asString(team?.name) || "Unknown team",
      goals: asNumber(row?.goals),
      assists: asNumber(row?.assists),
      penalties: asNumber(row?.penalties),
    };
  });
}

function mapTeams(payload: unknown): TeamView[] {
  const root = asObject(payload);
  const teams = asArray(root?.teams);

  return teams.map((item) => {
    const row = asObject(item);
    return {
      id: asNumber(row?.id),
      name: asString(row?.name) || "Unknown team",
      tla: asString(row?.tla),
    };
  });
}

function formatUtcDate(value: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FootballPage() {
  const [endpoint, setEndpoint] = useState<EndpointKey>("todayMatches");
  const [competition, setCompetition] = useState("PL");
  const [teamId, setTeamId] = useState("86");
  const [status, setStatus] = useState("SCHEDULED");
  const [season, setSeason] = useState(String(new Date().getFullYear()));
  const [limit, setLimit] = useState("10");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<unknown>(null);
  const [quota, setQuota] = useState<ApiResponse["quota"]>();

  const matches = useMemo(() => mapMatches(payload), [payload]);
  const standings = useMemo(() => mapStandings(payload), [payload]);
  const scorers = useMemo(() => mapScorers(payload), [payload]);
  const teams = useMemo(() => mapTeams(payload), [payload]);

  const quotaText = useMemo(() => {
    if (!quota) return "";
    const resetTime = new Date(quota.resetAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return `${quota.remaining} calls left this minute · resets at ${resetTime}${quota.cached ? " · cached response" : ""}`;
  }, [quota]);

  const buildQuery = () => {
    const search = new URLSearchParams({ endpoint });

    if (endpoint === "competitionMatches" || endpoint === "standings" || endpoint === "scorers" || endpoint === "competitionTeams") {
      search.set("competition", competition);
    }
    if (endpoint === "teamMatches") {
      search.set("teamId", teamId);
    }

    if (dateFrom) search.set("dateFrom", dateFrom);
    if (dateTo) search.set("dateTo", dateTo);
    if (status && (endpoint === "todayMatches" || endpoint === "competitionMatches" || endpoint === "teamMatches")) {
      search.set("status", status);
    }
    if (season && (endpoint === "competitionMatches" || endpoint === "standings" || endpoint === "scorers" || endpoint === "competitionTeams" || endpoint === "teamMatches")) {
      search.set("season", season);
    }
    if (limit && (endpoint === "scorers" || endpoint === "teamMatches")) {
      search.set("limit", limit);
    }

    return search.toString();
  };

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/football-data?${buildQuery()}`);
      const data = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error(data.error || "Failed to load football data");
      }

      setPayload(data.data ?? null);
      setQuota(data.quota);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load football data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="football-page">
      <section className="football-head">
        <p className="blog-sub">Live API</p>
        <h1 className="blog-title">Football Data Explorer</h1>
        <p className="football-subtitle">
          Pull data from football-data.org v4 with quota-safe caching. You have 10 provider calls per minute.
        </p>
      </section>

      <section className="football-layout">
        <aside className="football-filters">
          <div className="football-filter-group">
            <label className="admin-label" htmlFor="endpoint">Endpoint</label>
            <select id="endpoint" value={endpoint} onChange={(e) => setEndpoint(e.target.value as EndpointKey)} className="admin-select">
              <option value="todayMatches">Matches (global)</option>
              <option value="competitionMatches">Competition Matches</option>
              <option value="standings">Competition Standings</option>
              <option value="scorers">Top Scorers</option>
              <option value="competitionTeams">Competition Teams</option>
              <option value="teamMatches">Team Matches</option>
            </select>
          </div>

          {(endpoint === "competitionMatches" || endpoint === "standings" || endpoint === "scorers" || endpoint === "competitionTeams") && (
            <div className="football-filter-group">
              <label className="admin-label" htmlFor="competition">Competition</label>
              <select id="competition" value={competition} onChange={(e) => setCompetition(e.target.value)} className="admin-select">
                {COMPETITIONS.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {endpoint === "teamMatches" && (
            <div className="football-filter-group">
              <label className="admin-label" htmlFor="teamId">Team ID</label>
              <input
                id="teamId"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="admin-input"
                placeholder="86"
              />
            </div>
          )}

          <div className="football-filter-row">
            <div className="football-filter-group">
              <label className="admin-label" htmlFor="dateFrom">Date From</label>
              <input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="admin-input" />
            </div>
            <div className="football-filter-group">
              <label className="admin-label" htmlFor="dateTo">Date To</label>
              <input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="admin-input" />
            </div>
          </div>

          {(endpoint === "todayMatches" || endpoint === "competitionMatches" || endpoint === "teamMatches") && (
            <div className="football-filter-group">
              <label className="admin-label" htmlFor="status">Status</label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="admin-select">
                {STATUS_FILTERS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          )}

          {(endpoint === "competitionMatches" || endpoint === "standings" || endpoint === "scorers" || endpoint === "competitionTeams" || endpoint === "teamMatches") && (
            <div className="football-filter-group">
              <label className="admin-label" htmlFor="season">Season</label>
              <input id="season" value={season} onChange={(e) => setSeason(e.target.value)} className="admin-input" placeholder="2025" />
            </div>
          )}

          {(endpoint === "scorers" || endpoint === "teamMatches") && (
            <div className="football-filter-group">
              <label className="admin-label" htmlFor="limit">Limit</label>
              <input id="limit" value={limit} onChange={(e) => setLimit(e.target.value)} className="admin-input" placeholder="10" />
            </div>
          )}

          <button type="button" onClick={loadData} disabled={loading} className="admin-button admin-button-blue w-full">
            {loading ? "Loading..." : "Load Data"}
          </button>
          {quotaText && <p className="football-quota">{quotaText}</p>}
          {error && <p className="football-error">{error}</p>}
        </aside>

        <section className="football-results">
          {!payload && !loading && <p className="empty-state-desc">Pick filters and load data.</p>}

          {matches.length > 0 && (
            <div className="football-table-wrap">
              <table className="football-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Match</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Comp</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((item) => (
                    <tr key={item.id}>
                      <td>{formatUtcDate(item.utcDate)}</td>
                      <td>{item.home} vs {item.away}</td>
                      <td>{item.score}</td>
                      <td>{item.status}</td>
                      <td>{item.competition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {standings.length > 0 && (
            <div className="football-table-wrap">
              <table className="football-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((item) => (
                    <tr key={`${item.position}-${item.team}`}>
                      <td>{item.position}</td>
                      <td>{item.team}</td>
                      <td>{item.played}</td>
                      <td>{item.won}</td>
                      <td>{item.draw}</td>
                      <td>{item.lost}</td>
                      <td>{item.goalsFor}</td>
                      <td>{item.goalsAgainst}</td>
                      <td>{item.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {scorers.length > 0 && (
            <div className="football-table-wrap">
              <table className="football-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Goals</th>
                    <th>Assists</th>
                    <th>Pens</th>
                  </tr>
                </thead>
                <tbody>
                  {scorers.map((item) => (
                    <tr key={`${item.player}-${item.team}`}>
                      <td>{item.player}</td>
                      <td>{item.team}</td>
                      <td>{item.goals}</td>
                      <td>{item.assists}</td>
                      <td>{item.penalties}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {teams.length > 0 && (
            <div className="football-team-grid">
              {teams.map((item) => (
                <article key={item.id} className="football-team-card">
                  <p className="football-team-name">{item.name}</p>
                  <p className="football-team-meta">ID: {item.id}{item.tla ? ` · ${item.tla}` : ""}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
