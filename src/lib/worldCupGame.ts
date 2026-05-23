export type WorldCupCountry = {
  name: string;
  code: string;
};

export type WorldCupMatchVote = {
  a: number;
  b: number;
};

export type WorldCupVotes = Record<string, WorldCupMatchVote>;

// Legacy bracket types (kept for backward compatibility with previous settings data).
export type WorldCupMatch = {
  id: string;
  countryA: WorldCupCountry | null;
  countryB: WorldCupCountry | null;
  votes: WorldCupMatchVote;
  winner: WorldCupCountry | null;
};

export type WorldCupRound = {
  id: string;
  label: string;
  matches: WorldCupMatch[];
};

export type WorldCupBlock = {
  id: string;
  country: WorldCupCountry | null;
  grayedOut: boolean;
};

export type WorldCupWinnerSide = "a" | "b" | "";

export type WorldCupMatchConfig = {
  id: string;
  blockAId: string;
  blockBId: string;
  targetBlockId: string;
  winnerSide: WorldCupWinnerSide;
  live: boolean;
};

export type WorldCupGraphMatch = WorldCupMatchConfig & {
  countryA: WorldCupCountry | null;
  countryB: WorldCupCountry | null;
  winnerCountry: WorldCupCountry | null;
  votes: WorldCupMatchVote;
  canVote: boolean;
};

export type WorldCupGraph = {
  blocks: WorldCupBlock[];
  matches: WorldCupGraphMatch[];
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCode(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function parseBooleanToken(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;
  const token = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on", "live", "open"].includes(token)) return true;
  if (["0", "false", "no", "n", "off", "closed"].includes(token)) return false;
  return fallback;
}

function parseWinnerSide(value: unknown): WorldCupWinnerSide {
  if (value === "a" || value === "b") return value;
  if (typeof value !== "string") return "";
  const token = value.trim().toLowerCase();
  if (token === "a" || token === "1" || token === "left") return "a";
  if (token === "b" || token === "2" || token === "right") return "b";
  return "";
}

function sortById<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ai = Number(a.id);
    const bi = Number(b.id);
    if (Number.isFinite(ai) && Number.isFinite(bi)) return ai - bi;
    return a.id.localeCompare(b.id);
  });
}

function parseCountryToken(value: string): WorldCupCountry | null {
  const raw = normalizeText(value);
  if (!raw) return null;

  const [codePart, ...nameParts] = raw.split(":");
  const code = normalizeCode(codePart);
  if (!code) return null;

  const parsedName = normalizeText(nameParts.join(":"));
  return {
    code,
    name: parsedName || code.toUpperCase(),
  };
}

function formatCountryToken(country: WorldCupCountry | null): string {
  if (!country) return "";
  const code = country.code.toUpperCase();
  const name = normalizeText(country.name);
  if (!name || name.toUpperCase() === code) return code;
  return `${code}:${name}`;
}

function parseCountryValue(value: unknown): WorldCupCountry | null {
  if (!value) return null;
  if (typeof value === "string") return parseCountryToken(value);
  if (typeof value !== "object") return null;

  const input = value as { name?: unknown; code?: unknown };
  const code = normalizeCode(input.code);
  if (!code) return null;
  const name = normalizeText(input.name) || code.toUpperCase();
  return { code, name };
}

export function parseWorldCupCountries(value: unknown): WorldCupCountry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => parseCountryValue(entry))
    .filter((entry): entry is WorldCupCountry => !!entry);
}

export function parseWorldCupCountriesText(value: string): WorldCupCountry[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [namePart, codePart] = line.split("|");
      const name = normalizeText(namePart);
      const code = normalizeCode(codePart);
      if (!name || !code) return null;
      return { name, code };
    })
    .filter((entry): entry is WorldCupCountry => !!entry);
}

export function formatWorldCupCountriesText(countries: WorldCupCountry[]): string {
  return countries.map((country) => `${country.name}|${country.code.toUpperCase()}`).join("\n");
}

export function parseWorldCupVotes(value: unknown): WorldCupVotes {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>);
  const next: WorldCupVotes = {};
  for (const [key, rawVote] of entries) {
    if (!rawVote || typeof rawVote !== "object") continue;
    const vote = rawVote as { a?: unknown; b?: unknown };
    const a = typeof vote.a === "number" && Number.isFinite(vote.a) ? Math.max(0, Math.floor(vote.a)) : 0;
    const b = typeof vote.b === "number" && Number.isFinite(vote.b) ? Math.max(0, Math.floor(vote.b)) : 0;
    next[key] = { a, b };
  }
  return next;
}

export function parseWorldCupBlocks(value: unknown): WorldCupBlock[] {
  if (!Array.isArray(value)) return [];

  const blocks = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const block = entry as { id?: unknown; country?: unknown; grayedOut?: unknown };
      const id = normalizeText(block.id);
      if (!id) return null;

      return {
        id,
        country: parseCountryValue(block.country),
        grayedOut: parseBooleanToken(block.grayedOut, false),
      } satisfies WorldCupBlock;
    })
    .filter((entry): entry is WorldCupBlock => !!entry);

  return sortById(blocks);
}

export function parseWorldCupMatches(value: unknown): WorldCupMatchConfig[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const match = entry as {
        id?: unknown;
        blockAId?: unknown;
        blockBId?: unknown;
        targetBlockId?: unknown;
        winnerSide?: unknown;
        live?: unknown;
      };

      const id = normalizeText(match.id);
      const blockAId = normalizeText(match.blockAId);
      const blockBId = normalizeText(match.blockBId);
      const targetBlockId = normalizeText(match.targetBlockId);
      if (!id || !blockAId || !blockBId || !targetBlockId) return null;

      return {
        id,
        blockAId,
        blockBId,
        targetBlockId,
        winnerSide: parseWinnerSide(match.winnerSide),
        live: parseBooleanToken(match.live, false),
      } satisfies WorldCupMatchConfig;
    })
    .filter((entry): entry is WorldCupMatchConfig => !!entry);
}

export function parseWorldCupBlocksText(value: string): WorldCupBlock[] {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const blocks: WorldCupBlock[] = [];
  for (const line of lines) {
    const [idPart, countryPart, grayPart] = line.split("|");
    const id = normalizeText(idPart);
    if (!id) continue;

    blocks.push({
      id,
      country: parseCountryToken(countryPart || ""),
      grayedOut: parseBooleanToken(grayPart, false),
    });
  }

  return sortById(blocks);
}

export function formatWorldCupBlocksText(blocks: WorldCupBlock[]): string {
  return blocks
    .map((block) => `${block.id}|${formatCountryToken(block.country)}|${block.grayedOut ? "true" : "false"}`)
    .join("\n");
}

export function parseWorldCupMatchesText(value: string): WorldCupMatchConfig[] {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const matches: WorldCupMatchConfig[] = [];
  for (const line of lines) {
    const [idPart, blockAIdPart, blockBIdPart, targetPart, winnerPart, livePart] = line.split("|");
    const id = normalizeText(idPart);
    const blockAId = normalizeText(blockAIdPart);
    const blockBId = normalizeText(blockBIdPart);
    const targetBlockId = normalizeText(targetPart);
    if (!id || !blockAId || !blockBId || !targetBlockId) continue;

    matches.push({
      id,
      blockAId,
      blockBId,
      targetBlockId,
      winnerSide: parseWinnerSide(winnerPart),
      live: parseBooleanToken(livePart, false),
    });
  }

  return matches;
}

export function formatWorldCupMatchesText(matches: WorldCupMatchConfig[]): string {
  return matches
    .map((match) => {
      const winnerToken = match.winnerSide || "none";
      const liveToken = match.live ? "live" : "closed";
      return `${match.id}|${match.blockAId}|${match.blockBId}|${match.targetBlockId}|${winnerToken}|${liveToken}`;
    })
    .join("\n");
}

function roundLabel(index: number, totalRounds: number): string {
  if (totalRounds <= 0) return "Round";
  if (totalRounds === 1) return "Final";
  if (index === totalRounds) return "Final";
  if (index === totalRounds - 1) return "Semifinals";
  if (index === totalRounds - 2) return "Quarterfinals";
  return `Round ${index}`;
}

function nextPowerOfTwo(value: number): number {
  let next = 1;
  while (next < value) next *= 2;
  return next;
}

// Legacy auto-generated rounds from countries list.
export function buildWorldCupRounds(countries: WorldCupCountry[], votes: WorldCupVotes): WorldCupRound[] {
  if (countries.length < 2) return [];

  const paddedSize = nextPowerOfTwo(countries.length);
  let current: Array<WorldCupCountry | null> = [
    ...countries,
    ...Array.from({ length: paddedSize - countries.length }, () => null),
  ];
  const rounds: WorldCupRound[] = [];
  let roundIndex = 1;

  while (current.length > 1) {
    const matches: WorldCupMatch[] = [];
    const nextRound: Array<WorldCupCountry | null> = [];

    for (let i = 0; i < current.length; i += 2) {
      const countryA = current[i] || null;
      const countryB = current[i + 1] || null;
      const matchId = `R${roundIndex}-M${Math.floor(i / 2) + 1}`;
      const vote = votes[matchId] || { a: 0, b: 0 };

      let winner: WorldCupCountry | null = countryA || countryB;
      if (countryA && countryB) {
        winner = vote.b > vote.a ? countryB : countryA;
      }

      matches.push({
        id: matchId,
        countryA,
        countryB,
        votes: vote,
        winner,
      });
      nextRound.push(winner);
    }

    rounds.push({
      id: `R${roundIndex}`,
      label: "",
      matches,
    });
    current = nextRound;
    roundIndex += 1;
  }

  const totalRounds = rounds.length;
  return rounds.map((round, index) => ({
    ...round,
    label: roundLabel(index + 1, totalRounds),
  }));
}

export function buildWorldCupConfigFromCountries(countries: WorldCupCountry[]): {
  blocks: WorldCupBlock[];
  matches: WorldCupMatchConfig[];
} {
  if (countries.length < 2) return { blocks: [], matches: [] };

  const paddedSize = nextPowerOfTwo(countries.length);
  const blocks: WorldCupBlock[] = Array.from({ length: paddedSize }, (_, index) => ({
    id: String(index + 1),
    country: countries[index] || null,
    grayedOut: false,
  }));

  const matches: WorldCupMatchConfig[] = [];
  let currentBlockIds = blocks.map((block) => block.id);
  let nextBlockNumericId = paddedSize + 1;
  let matchNumericId = 1;

  while (currentBlockIds.length > 1) {
    const nextRoundIds: string[] = [];
    for (let i = 0; i < currentBlockIds.length; i += 2) {
      const targetBlockId = String(nextBlockNumericId++);
      blocks.push({
        id: targetBlockId,
        country: null,
        grayedOut: false,
      });

      matches.push({
        id: `M${matchNumericId++}`,
        blockAId: currentBlockIds[i],
        blockBId: currentBlockIds[i + 1],
        targetBlockId,
        winnerSide: "",
        live: matches.length === 0,
      });
      nextRoundIds.push(targetBlockId);
    }
    currentBlockIds = nextRoundIds;
  }

  return {
    blocks: sortById(blocks),
    matches,
  };
}

export function buildWorldCupGraph(
  blocksInput: WorldCupBlock[],
  matches: WorldCupMatchConfig[],
  votes: WorldCupVotes,
): WorldCupGraph {
  const blockMap = new Map(
    blocksInput.map((block) => [
      block.id,
      {
        id: block.id,
        country: block.country ? { ...block.country } : null,
        grayedOut: !!block.grayedOut,
      } satisfies WorldCupBlock,
    ]),
  );

  const autoGraySet = new Set<string>();
  const graphMatches: WorldCupGraphMatch[] = [];

  for (const match of matches) {
    const blockA = blockMap.get(match.blockAId) || null;
    const blockB = blockMap.get(match.blockBId) || null;
    const countryA = blockA?.country || null;
    const countryB = blockB?.country || null;
    const vote = votes[match.id] || { a: 0, b: 0 };

    let winnerCountry: WorldCupCountry | null = null;
    if (match.winnerSide === "a" && countryA) {
      winnerCountry = countryA;
      autoGraySet.add(match.blockBId);
    } else if (match.winnerSide === "b" && countryB) {
      winnerCountry = countryB;
      autoGraySet.add(match.blockAId);
    }

    if (winnerCountry) {
      const target = blockMap.get(match.targetBlockId);
      if (target) {
        target.country = { ...winnerCountry };
      }
    }

    const canVote = match.live && !match.winnerSide && !!countryA && !!countryB;
    graphMatches.push({
      ...match,
      countryA,
      countryB,
      winnerCountry,
      votes: vote,
      canVote,
    });
  }

  const graphBlocks = sortById(Array.from(blockMap.values())).map((block) => ({
    ...block,
    grayedOut: block.grayedOut || autoGraySet.has(block.id),
  }));

  return {
    blocks: graphBlocks,
    matches: graphMatches,
  };
}

