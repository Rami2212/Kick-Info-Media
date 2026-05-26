export type LiveMatchTeam = {
  name: string;
  flagImageUrl: string;
  score: string;
};

export type LiveMatchStat = {
  label: string;
  teamA: string;
  teamB: string;
};

export type LiveMatchLineupPlayer = {
  name: string;
  position: string;
};

export type LiveMatchData = {
  title: string;
  subtitle: string;
  status: string;
  kickoff: string;
  venue: string;
  teamA: LiveMatchTeam;
  teamB: LiveMatchTeam;
  stats: LiveMatchStat[];
  lineups: {
    teamA: LiveMatchLineupPlayer[];
    teamB: LiveMatchLineupPlayer[];
  };
};

const STARTING_XI_POSITIONS = [
  "GK",
  "RB",
  "RCB",
  "LCB",
  "LB",
  "CDM",
  "RCM",
  "LCM",
  "RW",
  "ST",
  "LW",
] as const;

function defaultStartingXi(): LiveMatchLineupPlayer[] {
  return STARTING_XI_POSITIONS.map((position) => ({ name: "TBD", position }));
}

const DEFAULT_LIVE_MATCH_DATA: LiveMatchData = {
  title: "Live Match",
  subtitle: "Match center",
  status: "TBD",
  kickoff: "TBD",
  venue: "TBD",
  teamA: {
    name: "TBD",
    flagImageUrl: "",
    score: "-",
  },
  teamB: {
    name: "TBD",
    flagImageUrl: "",
    score: "-",
  },
  stats: [
    { label: "Shots on Goal", teamA: "-", teamB: "-" },
    { label: "Total Shots", teamA: "-", teamB: "-" },
    { label: "Ball Possession", teamA: "-", teamB: "-" },
    { label: "Corner Kicks", teamA: "-", teamB: "-" },
    { label: "Fouls", teamA: "-", teamB: "-" },
  ],
  lineups: {
    teamA: defaultStartingXi(),
    teamB: defaultStartingXi(),
  },
};

export const DEFAULT_LIVE_MATCH_JSON = JSON.stringify(DEFAULT_LIVE_MATCH_DATA, null, 2);

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseTeam(value: unknown, fallback: LiveMatchTeam): LiveMatchTeam {
  if (!value || typeof value !== "object") return { ...fallback };
  const raw = value as Record<string, unknown>;
  return {
    name: normalizeText(raw.name) || fallback.name,
    flagImageUrl: normalizeText(raw.flagImageUrl),
    score: normalizeText(raw.score) || fallback.score,
  };
}

function parseStats(value: unknown): LiveMatchStat[] {
  if (!Array.isArray(value)) return DEFAULT_LIVE_MATCH_DATA.stats.map((row) => ({ ...row }));

  const rows = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const label = normalizeText(raw.label);
      if (!label) return null;
      return {
        label,
        teamA: normalizeText(raw.teamA) || "-",
        teamB: normalizeText(raw.teamB) || "-",
      };
    })
    .filter((row): row is LiveMatchStat => !!row);

  return rows.length > 0 ? rows : DEFAULT_LIVE_MATCH_DATA.stats.map((row) => ({ ...row }));
}

function parseLineup(value: unknown): LiveMatchLineupPlayer[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const name = normalizeText(raw.name);
      const position = normalizeText(raw.position);
      if (!name && !position) return null;
      return {
        name: name || "TBD",
        position: position || "-",
      };
    })
    .filter((player): player is LiveMatchLineupPlayer => !!player);
}

function normalizeFullLineup(
  lineup: LiveMatchLineupPlayer[],
  fallback: LiveMatchLineupPlayer[],
): LiveMatchLineupPlayer[] {
  return fallback.map((defaultPlayer, index) => {
    const next = lineup[index];
    return {
      name: next?.name || defaultPlayer.name,
      position: next?.position || defaultPlayer.position,
    };
  });
}

export function getDefaultLiveMatchData(): LiveMatchData {
  return {
    ...DEFAULT_LIVE_MATCH_DATA,
    teamA: { ...DEFAULT_LIVE_MATCH_DATA.teamA },
    teamB: { ...DEFAULT_LIVE_MATCH_DATA.teamB },
    stats: DEFAULT_LIVE_MATCH_DATA.stats.map((row) => ({ ...row })),
    lineups: {
      teamA: DEFAULT_LIVE_MATCH_DATA.lineups.teamA.map((player) => ({ ...player })),
      teamB: DEFAULT_LIVE_MATCH_DATA.lineups.teamB.map((player) => ({ ...player })),
    },
  };
}

export function parseLiveMatchData(value: unknown): LiveMatchData | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const defaults = getDefaultLiveMatchData();
  const rawLineups = raw.lineups && typeof raw.lineups === "object"
    ? raw.lineups as Record<string, unknown>
    : {};

  return {
    title: normalizeText(raw.title) || defaults.title,
    subtitle: normalizeText(raw.subtitle) || defaults.subtitle,
    status: normalizeText(raw.status) || defaults.status,
    kickoff: normalizeText(raw.kickoff) || defaults.kickoff,
    venue: normalizeText(raw.venue) || defaults.venue,
    teamA: parseTeam(raw.teamA, defaults.teamA),
    teamB: parseTeam(raw.teamB, defaults.teamB),
    stats: parseStats(raw.stats),
    lineups: {
      teamA: normalizeFullLineup(parseLineup(rawLineups.teamA), defaults.lineups.teamA),
      teamB: normalizeFullLineup(parseLineup(rawLineups.teamB), defaults.lineups.teamB),
    },
  };
}

export function parseLiveMatchJsonText(value: string): LiveMatchData | null {
  const text = normalizeText(value);
  if (!text) return null;

  try {
    return parseLiveMatchData(JSON.parse(text) as unknown);
  } catch {
    return null;
  }
}
