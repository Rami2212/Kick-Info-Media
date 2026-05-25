export type ScheduleGroupTeam = {
  code: string;
  name: string;
  flagImageUrl: string;
};

export type ScheduleGroup = {
  id: string;
  name: string;
  teams: ScheduleGroupTeam[];
};

export type ScheduleGroupStageData = {
  groups: ScheduleGroup[];
};

const TEAM_COUNT = 4;

const DEFAULT_GROUPS: Array<{ id: string; name: string; teams: Array<{ code: string; name: string; flagCode: string }> }> = [
  {
    id: "A",
    name: "Group A",
    teams: [
      { code: "MEX", name: "Mexico", flagCode: "mx" },
      { code: "RSA", name: "South Africa", flagCode: "za" },
      { code: "KOR", name: "Korea Republic", flagCode: "kr" },
      { code: "CZE", name: "Czechia", flagCode: "cz" },
    ],
  },
  {
    id: "B",
    name: "Group B",
    teams: [
      { code: "CAN", name: "Canada", flagCode: "ca" },
      { code: "BIH", name: "Bosnia and Herzegovina", flagCode: "ba" },
      { code: "QAT", name: "Qatar", flagCode: "qa" },
      { code: "SUI", name: "Switzerland", flagCode: "ch" },
    ],
  },
  {
    id: "C",
    name: "Group C",
    teams: [
      { code: "BRA", name: "Brazil", flagCode: "br" },
      { code: "MAR", name: "Morocco", flagCode: "ma" },
      { code: "HAI", name: "Haiti", flagCode: "ht" },
      { code: "SCO", name: "Scotland", flagCode: "gb-sct" },
    ],
  },
  {
    id: "D",
    name: "Group D",
    teams: [
      { code: "USA", name: "USA", flagCode: "us" },
      { code: "PAR", name: "Paraguay", flagCode: "py" },
      { code: "AUS", name: "Australia", flagCode: "au" },
      { code: "TUR", name: "Turkey", flagCode: "tr" },
    ],
  },
  {
    id: "E",
    name: "Group E",
    teams: [
      { code: "GER", name: "Germany", flagCode: "de" },
      { code: "CUW", name: "Curacao", flagCode: "cw" },
      { code: "CIV", name: "Cote d'Ivoire", flagCode: "ci" },
      { code: "ECU", name: "Ecuador", flagCode: "ec" },
    ],
  },
  {
    id: "F",
    name: "Group F",
    teams: [
      { code: "NED", name: "Netherlands", flagCode: "nl" },
      { code: "JPN", name: "Japan", flagCode: "jp" },
      { code: "SWE", name: "Sweden", flagCode: "se" },
      { code: "TUN", name: "Tunisia", flagCode: "tn" },
    ],
  },
  {
    id: "G",
    name: "Group G",
    teams: [
      { code: "BEL", name: "Belgium", flagCode: "be" },
      { code: "EGY", name: "Egypt", flagCode: "eg" },
      { code: "IRN", name: "IR Iran", flagCode: "ir" },
      { code: "NZL", name: "New Zealand", flagCode: "nz" },
    ],
  },
  {
    id: "H",
    name: "Group H",
    teams: [
      { code: "ESP", name: "Spain", flagCode: "es" },
      { code: "CPV", name: "Cabo Verde", flagCode: "cv" },
      { code: "KSA", name: "Saudi Arabia", flagCode: "sa" },
      { code: "URU", name: "Uruguay", flagCode: "uy" },
    ],
  },
  {
    id: "I",
    name: "Group I",
    teams: [
      { code: "FRA", name: "France", flagCode: "fr" },
      { code: "SEN", name: "Senegal", flagCode: "sn" },
      { code: "IRQ", name: "Iraq", flagCode: "iq" },
      { code: "NOR", name: "Norway", flagCode: "no" },
    ],
  },
  {
    id: "J",
    name: "Group J",
    teams: [
      { code: "ARG", name: "Argentina", flagCode: "ar" },
      { code: "ALG", name: "Algeria", flagCode: "dz" },
      { code: "AUT", name: "Austria", flagCode: "at" },
      { code: "JOR", name: "Jordan", flagCode: "jo" },
    ],
  },
  {
    id: "K",
    name: "Group K",
    teams: [
      { code: "POR", name: "Portugal", flagCode: "pt" },
      { code: "COD", name: "Congo DR", flagCode: "cd" },
      { code: "UZB", name: "Uzbekistan", flagCode: "uz" },
      { code: "COL", name: "Colombia", flagCode: "co" },
    ],
  },
  {
    id: "L",
    name: "Group L",
    teams: [
      { code: "ENG", name: "England", flagCode: "gb-eng" },
      { code: "CRO", name: "Croatia", flagCode: "hr" },
      { code: "GHA", name: "Ghana", flagCode: "gh" },
      { code: "PAN", name: "Panama", flagCode: "pa" },
    ],
  },
];

const DEFAULT_SCHEDULE_GROUP_STAGE_DATA: ScheduleGroupStageData = {
  groups: DEFAULT_GROUPS.map((group) => ({
    id: group.id,
    name: group.name,
    teams: group.teams.map((team) => ({
      code: team.code,
      name: team.name,
      flagImageUrl: `https://flagcdn.com/w80/${team.flagCode}.png`,
    })),
  })),
};

export const DEFAULT_SCHEDULE_GROUP_STAGE_JSON = JSON.stringify(DEFAULT_SCHEDULE_GROUP_STAGE_DATA, null, 2);

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cloneData(data: ScheduleGroupStageData): ScheduleGroupStageData {
  return {
    groups: data.groups.map((group) => ({
      ...group,
      teams: group.teams.map((team) => ({ ...team })),
    })),
  };
}

function parseTeam(value: unknown): ScheduleGroupTeam | null {
  if (!value || typeof value !== "object") return null;
  const input = value as { code?: unknown; name?: unknown; flagImageUrl?: unknown };
  const code = normalizeText(input.code).toUpperCase();
  const name = normalizeText(input.name);
  const flagImageUrl = normalizeText(input.flagImageUrl);
  if (!code || !name) return null;
  return { code, name, flagImageUrl };
}

function parseGroup(value: unknown): ScheduleGroup | null {
  if (!value || typeof value !== "object") return null;
  const input = value as { id?: unknown; name?: unknown; teams?: unknown };
  const id = normalizeText(input.id).toUpperCase();
  const name = normalizeText(input.name);
  if (!id || !name || !Array.isArray(input.teams)) return null;

  const parsedTeams = input.teams
    .map((team) => parseTeam(team))
    .filter((team): team is ScheduleGroupTeam => !!team)
    .slice(0, TEAM_COUNT);

  if (parsedTeams.length !== TEAM_COUNT) return null;

  return {
    id,
    name,
    teams: parsedTeams,
  };
}

export function getDefaultScheduleGroupStageData(): ScheduleGroupStageData {
  return cloneData(DEFAULT_SCHEDULE_GROUP_STAGE_DATA);
}

export function parseScheduleGroupStageData(value: unknown): ScheduleGroupStageData | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { groups?: unknown };
  if (!Array.isArray(raw.groups)) return null;

  const parsedGroups = raw.groups
    .map((group) => parseGroup(group))
    .filter((group): group is ScheduleGroup => !!group)
    .slice(0, 12);

  if (parsedGroups.length !== 12) return null;

  return {
    groups: parsedGroups,
  };
}

export function parseScheduleGroupStageJsonText(value: string): ScheduleGroupStageData | null {
  const text = normalizeText(value);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as unknown;
    return parseScheduleGroupStageData(parsed);
  } catch {
    return null;
  }
}

