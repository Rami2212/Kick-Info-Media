export type ScheduleBracketSlot = {
  id: number;
  code: string;
  name: string;
  flagImageUrl: string;
};

export type ScheduleBracketData = {
  slots: ScheduleBracketSlot[];
};

export type ScheduleBracketSlotLayout = {
  id: number;
  col: number;
  row: number;
};

export type ScheduleBracketConnection = {
  from: number;
  to: number;
};

const SLOT_COUNT = 64;

const SEED_TEAMS: Array<{ name: string; flagCode: string }> = [
  { name: "Mexico", flagCode: "mx" },
  { name: "South Africa", flagCode: "za" },
  { name: "Korea Republic", flagCode: "kr" },
  { name: "Czechia", flagCode: "cz" },
  { name: "Canada", flagCode: "ca" },
  { name: "Bosnia and Herzegovina", flagCode: "ba" },
  { name: "Qatar", flagCode: "qa" },
  { name: "Switzerland", flagCode: "ch" },
  { name: "Brazil", flagCode: "br" },
  { name: "Morocco", flagCode: "ma" },
  { name: "Haiti", flagCode: "ht" },
  { name: "Scotland", flagCode: "gb-sct" },
  { name: "USA", flagCode: "us" },
  { name: "Paraguay", flagCode: "py" },
  { name: "Australia", flagCode: "au" },
  { name: "Turkey", flagCode: "tr" },
  { name: "Germany", flagCode: "de" },
  { name: "Curacao", flagCode: "cw" },
  { name: "Cote d'Ivoire", flagCode: "ci" },
  { name: "Ecuador", flagCode: "ec" },
  { name: "Netherlands", flagCode: "nl" },
  { name: "Japan", flagCode: "jp" },
  { name: "Sweden", flagCode: "se" },
  { name: "Tunisia", flagCode: "tn" },
  { name: "Belgium", flagCode: "be" },
  { name: "Egypt", flagCode: "eg" },
  { name: "IR Iran", flagCode: "ir" },
  { name: "New Zealand", flagCode: "nz" },
  { name: "Spain", flagCode: "es" },
  { name: "Cabo Verde", flagCode: "cv" },
  { name: "Saudi Arabia", flagCode: "sa" },
  { name: "Uruguay", flagCode: "uy" },
];

const DEFAULT_SLOT_CODES: Record<number, string> = {
  1: "1E",
  2: "3ABCDF",
  3: "1I",
  4: "3CDFGH",
  5: "2A",
  6: "2B",
  7: "1F",
  8: "2C",
  9: "2K",
  10: "2L",
  11: "1H",
  12: "2J",
  13: "1D",
  14: "3BEFIJ",
  15: "1G",
  16: "3AEHIJ",
  17: "W74",
  18: "W77",
  19: "W73",
  20: "W75",
  21: "W83",
  22: "W84",
  23: "W81",
  24: "W82",
  25: "W89",
  26: "W90",
  27: "W93",
  28: "W94",
  29: "W97",
  30: "W98",
  31: "W101",
  32: "W102",
  33: "W99",
  34: "W100",
  35: "W91",
  36: "W92",
  37: "W95",
  38: "W96",
  39: "W76",
  40: "W78",
  41: "W79",
  42: "W80",
  43: "W86",
  44: "W88",
  45: "W85",
  46: "W87",
  47: "1C",
  48: "2F",
  49: "2E",
  50: "2I",
  51: "1A",
  52: "3CEFHI",
  53: "1L",
  54: "3EHIJK",
  55: "1J",
  56: "2H",
  57: "2D",
  58: "2G",
  59: "1B",
  60: "3EFGIJ",
  61: "1K",
  62: "3DEIJL",
  63: "RU101",
  64: "RU102",
};

function defaultCodeById(id: number): string {
  return DEFAULT_SLOT_CODES[id] || "";
}

function createSlot(id: number, name = "TBD", flagImageUrl = "", code = ""): ScheduleBracketSlot {
  return { id, code: code || defaultCodeById(id), name, flagImageUrl };
}

function buildDefaultSlots(): ScheduleBracketSlot[] {
  const byId = new Map<number, ScheduleBracketSlot>();
  for (let id = 1; id <= SLOT_COUNT; id += 1) {
    byId.set(id, createSlot(id));
  }

  for (let i = 0; i < SEED_TEAMS.length; i += 1) {
    const seed = SEED_TEAMS[i];
    const id = i < 16 ? i + 1 : 47 + (i - 16);
    byId.set(
      id,
      createSlot(id, seed.name, `https://flagcdn.com/w80/${seed.flagCode}.png`),
    );
  }

  return Array.from({ length: SLOT_COUNT }, (_, index) => byId.get(index + 1) || createSlot(index + 1));
}

const DEFAULT_SCHEDULE_BRACKET_DATA: ScheduleBracketData = {
  slots: buildDefaultSlots(),
};

export const DEFAULT_SCHEDULE_BRACKET_JSON = JSON.stringify(
  { slots: DEFAULT_SCHEDULE_BRACKET_DATA.slots },
  null,
  2,
);

function cloneData(data: ScheduleBracketData): ScheduleBracketData {
  return {
    slots: data.slots.map((slot) => ({ ...slot })),
  };
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const clean = Math.floor(value);
    if (clean >= 1 && clean <= SLOT_COUNT) return clean;
    return null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      const clean = Math.floor(parsed);
      if (clean >= 1 && clean <= SLOT_COUNT) return clean;
    }
  }

  return null;
}

export function getDefaultScheduleBracketData(): ScheduleBracketData {
  return cloneData(DEFAULT_SCHEDULE_BRACKET_DATA);
}

export function parseScheduleBracketData(value: unknown): ScheduleBracketData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as { slots?: unknown };
  if (!Array.isArray(raw.slots)) {
    return null;
  }

  const merged = getDefaultScheduleBracketData();
  const byId = new Map<number, ScheduleBracketSlot>(merged.slots.map((slot) => [slot.id, slot]));

  for (const item of raw.slots) {
    if (!item || typeof item !== "object") continue;
    const row = item as { id?: unknown; code?: unknown; name?: unknown; flagImageUrl?: unknown };
    const id = normalizeId(row.id);
    if (!id) continue;

    const current = byId.get(id) || createSlot(id);
    const code = normalizeText(row.code) || current.code || defaultCodeById(id);
    const name = normalizeText(row.name) || "TBD";
    const flagImageUrl = normalizeText(row.flagImageUrl);
    byId.set(id, { ...current, code, name, flagImageUrl });
  }

  return {
    slots: Array.from({ length: SLOT_COUNT }, (_, index) => byId.get(index + 1) || createSlot(index + 1)),
  };
}

export function parseScheduleBracketJsonText(value: string): ScheduleBracketData | null {
  const text = normalizeText(value);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as unknown;
    return parseScheduleBracketData(parsed);
  } catch {
    return null;
  }
}

function appendRangeLayouts(
  list: ScheduleBracketSlotLayout[],
  startId: number,
  count: number,
  col: number,
  startRow: number,
  step: number,
) {
  for (let index = 0; index < count; index += 1) {
    list.push({
      id: startId + index,
      col,
      row: startRow + index * step,
    });
  }
}

const slotLayouts: ScheduleBracketSlotLayout[] = [];

appendRangeLayouts(slotLayouts, 1, 16, 0, 0, 2);   // Left R32
appendRangeLayouts(slotLayouts, 17, 8, 1, 1, 4);   // Left R16
appendRangeLayouts(slotLayouts, 25, 4, 2, 3, 8);   // Left QF
appendRangeLayouts(slotLayouts, 29, 2, 3, 7, 16);  // Left SF
appendRangeLayouts(slotLayouts, 31, 1, 4, 14, 1);  // Final slot A
appendRangeLayouts(slotLayouts, 32, 1, 4, 16, 1);  // Final slot B
appendRangeLayouts(slotLayouts, 33, 2, 5, 7, 16);  // Right SF
appendRangeLayouts(slotLayouts, 35, 4, 6, 3, 8);   // Right QF
appendRangeLayouts(slotLayouts, 39, 8, 7, 1, 4);   // Right R16
appendRangeLayouts(slotLayouts, 47, 16, 8, 0, 2);  // Right R32

export const SCHEDULE_BRACKET_LAYOUT: ScheduleBracketSlotLayout[] = slotLayouts;

const bracketConnections: ScheduleBracketConnection[] = [];

function appendPairConnections(startChildId: number, pairCount: number, parentStartId: number) {
  for (let index = 0; index < pairCount; index += 1) {
    const firstChild = startChildId + index * 2;
    const secondChild = firstChild + 1;
    const parent = parentStartId + index;
    bracketConnections.push({ from: firstChild, to: parent });
    bracketConnections.push({ from: secondChild, to: parent });
  }
}

appendPairConnections(1, 8, 17);
appendPairConnections(17, 4, 25);
appendPairConnections(25, 2, 29);
bracketConnections.push({ from: 29, to: 31 }, { from: 30, to: 31 });

appendPairConnections(47, 8, 39);
appendPairConnections(39, 4, 35);
appendPairConnections(35, 2, 33);
bracketConnections.push({ from: 33, to: 32 }, { from: 34, to: 32 });

export const SCHEDULE_BRACKET_CONNECTIONS: ScheduleBracketConnection[] = bracketConnections;

export const SCHEDULE_BRACKET_COLUMNS = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Final",
  "Semi-final",
  "Quarter-final",
  "Round of 16",
  "Round of 32",
] as const;
