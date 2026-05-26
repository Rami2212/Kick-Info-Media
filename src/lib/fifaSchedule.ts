export type FifaScheduleFixture = {
  id: string;
  stage: string;
  date: string; // MM/DD/YYYY
  time: string; // HH:mm
  slotA: number;
  slotB: number;
  teamA?: FifaScheduleTeam;
  teamB?: FifaScheduleTeam;
};

export type FifaScheduleTeam = {
  name: string;
  flagImageUrl: string;
};

export type FifaScheduleData = {
  fixtures: FifaScheduleFixture[];
};

const MIN_SLOT_ID = 1;
const MAX_SLOT_ID = 64;

const DEFAULT_FIXTURES: FifaScheduleFixture[] = [
  { id: "M74", stage: "Round of 32", date: "06/30/2026", time: "02:00", slotA: 1, slotB: 2 },
  { id: "M76", stage: "Round of 32", date: "06/29/2026", time: "22:30", slotA: 47, slotB: 48 },
  { id: "M77", stage: "Round of 32", date: "07/01/2026", time: "02:30", slotA: 3, slotB: 4 },
  { id: "M78", stage: "Round of 32", date: "06/30/2026", time: "22:30", slotA: 49, slotB: 50 },
  { id: "M73", stage: "Round of 32", date: "06/29/2026", time: "00:30", slotA: 5, slotB: 6 },
  { id: "M79", stage: "Round of 32", date: "07/01/2026", time: "06:30", slotA: 51, slotB: 52 },
  { id: "M75", stage: "Round of 32", date: "06/30/2026", time: "06:30", slotA: 7, slotB: 8 },
  { id: "M80", stage: "Round of 32", date: "07/01/2026", time: "21:30", slotA: 53, slotB: 54 },
  { id: "M83", stage: "Round of 32", date: "07/03/2026", time: "04:30", slotA: 9, slotB: 10 },
  { id: "M86", stage: "Round of 32", date: "07/04/2026", time: "03:30", slotA: 55, slotB: 56 },
  { id: "M84", stage: "Round of 32", date: "07/03/2026", time: "00:30", slotA: 11, slotB: 12 },
  { id: "M88", stage: "Round of 32", date: "07/03/2026", time: "23:30", slotA: 57, slotB: 58 },
  { id: "M81", stage: "Round of 32", date: "07/02/2026", time: "05:30", slotA: 13, slotB: 14 },
  { id: "M85", stage: "Round of 32", date: "07/03/2026", time: "08:30", slotA: 59, slotB: 60 },
  { id: "M82", stage: "Round of 32", date: "07/02/2026", time: "01:30", slotA: 15, slotB: 16 },
  { id: "M87", stage: "Round of 32", date: "07/04/2026", time: "07:00", slotA: 61, slotB: 62 },
  { id: "M89", stage: "Round of 16", date: "07/05/2026", time: "02:30", slotA: 17, slotB: 18 },
  { id: "M90", stage: "Round of 16", date: "07/04/2026", time: "22:30", slotA: 19, slotB: 20 },
  { id: "M93", stage: "Round of 16", date: "07/07/2026", time: "00:30", slotA: 21, slotB: 22 },
  { id: "M94", stage: "Round of 16", date: "07/07/2026", time: "05:30", slotA: 23, slotB: 24 },
  { id: "M91", stage: "Round of 16", date: "07/06/2026", time: "01:30", slotA: 39, slotB: 40 },
  { id: "M92", stage: "Round of 16", date: "07/06/2026", time: "05:30", slotA: 41, slotB: 42 },
  { id: "M95", stage: "Round of 16", date: "07/07/2026", time: "21:30", slotA: 43, slotB: 44 },
  { id: "M96", stage: "Round of 16", date: "07/08/2026", time: "01:30", slotA: 45, slotB: 46 },
  { id: "M97", stage: "Quarter-final", date: "07/10/2026", time: "01:30", slotA: 25, slotB: 26 },
  { id: "M98", stage: "Quarter-final", date: "07/11/2026", time: "00:30", slotA: 27, slotB: 28 },
  { id: "M99", stage: "Quarter-final", date: "07/12/2026", time: "02:30", slotA: 35, slotB: 36 },
  { id: "M100", stage: "Quarter-final", date: "07/12/2026", time: "06:30", slotA: 37, slotB: 38 },
  { id: "M101", stage: "Semi-final", date: "07/15/2026", time: "00:30", slotA: 29, slotB: 30 },
  { id: "M102", stage: "Semi-final", date: "07/16/2026", time: "00:30", slotA: 33, slotB: 34 },
  { id: "M103", stage: "Third-place Play-off", date: "07/19/2026", time: "02:30", slotA: 63, slotB: 64 },
  { id: "M104", stage: "Final", date: "07/20/2026", time: "00:30", slotA: 31, slotB: 32 },
];

const DEFAULT_FIFA_SCHEDULE_DATA: FifaScheduleData = {
  fixtures: DEFAULT_FIXTURES.map((fixture) => ({ ...fixture })),
};

export const DEFAULT_FIFA_SCHEDULE_JSON = JSON.stringify(DEFAULT_FIFA_SCHEDULE_DATA, null, 2);

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSlot(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  const clean = Math.floor(parsed);
  if (clean < MIN_SLOT_ID || clean > MAX_SLOT_ID) return 0;
  return clean;
}

function parseTeam(value: unknown): FifaScheduleTeam | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const name = normalizeText(raw.name);
  const flagImageUrl = normalizeText(raw.flagImageUrl);
  if (!name && !flagImageUrl) return undefined;
  return { name, flagImageUrl };
}

function parseFixture(value: unknown): FifaScheduleFixture | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const id = normalizeText(raw.id);
  const stage = normalizeText(raw.stage);
  const date = normalizeText(raw.date);
  const time = normalizeText(raw.time);
  const slotA = normalizeSlot(raw.slotA);
  const slotB = normalizeSlot(raw.slotB);
  const teamA = parseTeam(raw.teamA);
  const teamB = parseTeam(raw.teamB);

  if (!id || !stage || !date || !time || !slotA || !slotB) return null;

  return {
    id,
    stage,
    date,
    time,
    slotA,
    slotB,
    ...(teamA ? { teamA } : {}),
    ...(teamB ? { teamB } : {}),
  };
}

export function getDefaultFifaScheduleData(): FifaScheduleData {
  return {
    fixtures: DEFAULT_FIFA_SCHEDULE_DATA.fixtures.map((fixture) => ({ ...fixture })),
  };
}

export function parseFifaScheduleData(value: unknown): FifaScheduleData | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { fixtures?: unknown };
  if (!Array.isArray(raw.fixtures)) return null;

  const parsed = raw.fixtures
    .map((fixture) => parseFixture(fixture))
    .filter((fixture): fixture is FifaScheduleFixture => !!fixture);

  if (parsed.length === 0) return null;
  return { fixtures: parsed };
}

export function parseFifaScheduleJsonText(value: string): FifaScheduleData | null {
  const text = normalizeText(value);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as unknown;
    return parseFifaScheduleData(parsed);
  } catch {
    return null;
  }
}
