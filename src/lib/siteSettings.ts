import { getMongoDb } from "@/lib/mongodb";
import {
  buildWorldCupConfigFromCountries,
  buildWorldCupGraph,
  parseWorldCupBlocks,
  parseWorldCupCountries,
  parseWorldCupMatches,
  type WorldCupMatchVote,
  parseWorldCupVotes,
  type WorldCupBlock,
  type WorldCupGraph,
  type WorldCupMatchConfig,
  type WorldCupVotes,
} from "@/lib/worldCupGame";
import {
  DEFAULT_RANKINGS_JSON,
  getDefaultRankingsData,
  parseRankingsJsonText,
  type RankingsData,
} from "@/lib/rankings";

export type CoverPageSettings = {
  title: string;
  subtitle: string;
  image_url: string;
  video_url: string;
  cta_label: string;
  cta_url: string;
};

export type SiteSettings = {
  id: string;
  coverPage: CoverPageSettings;
  extra: Record<string, unknown>;
  updated_at: string;
};

export type HomePostSelections = {
  heroPostIds: string[];
  topStoryPostIds: string[];
};

export type WorldCupSettings = {
  blocks: WorldCupBlock[];
  matches: WorldCupMatchConfig[];
  votes: WorldCupVotes;
  activePollMatchId: string;
  graph: WorldCupGraph;
};

export type NextMatchTeam = {
  name: string;
  flagImageUrl: string;
};

export type NextMatchSettings = {
  matchId: string;
  teamA: NextMatchTeam;
  teamB: NextMatchTeam;
  votes: WorldCupMatchVote;
  hasTeams: boolean;
};

export type RankingsSettings = RankingsData & {
  rankingsJson: string;
};

type SiteSettingsDoc = SiteSettings & {
  _id?: unknown;
};

const SETTINGS_ID = "site_settings";

function collection() {
  return getMongoDb().then((db) => db.collection<SiteSettingsDoc>("site_settings"));
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePostIds(value: unknown): string[] {
  if (!Array.isArray(value)) return ["", "", "", ""];
  return Array.from({ length: 4 }, (_, index) => normalizeText(value[index]));
}

export function getHomePostSelections(settings: SiteSettings): HomePostSelections {
  return {
    heroPostIds: normalizePostIds(settings.extra.heroPostIds),
    topStoryPostIds: normalizePostIds(settings.extra.topStoryPostIds),
  };
}

export function getWorldCupSettings(settings: SiteSettings): WorldCupSettings {
  let blocks = parseWorldCupBlocks(settings.extra.worldCupBlocks);
  let matches = parseWorldCupMatches(settings.extra.worldCupMatches);
  const votes = parseWorldCupVotes(settings.extra.worldCupVotes);
  const activePollMatchId = normalizeText(settings.extra.worldCupActiveMatchId);

  // Backward compatibility for existing country-only setup.
  if (blocks.length === 0 && matches.length === 0) {
    const countries = parseWorldCupCountries(settings.extra.worldCupCountries);
    if (countries.length > 0) {
      const legacy = buildWorldCupConfigFromCountries(countries);
      blocks = legacy.blocks;
      matches = legacy.matches;
    }
  }

  return {
    blocks,
    matches,
    votes,
    activePollMatchId,
    graph: buildWorldCupGraph(blocks, matches, votes),
  };
}

export function getNextMatchSettings(settings: SiteSettings): NextMatchSettings {
  const extra = settings.extra;
  const votes = parseWorldCupVotes(extra.worldCupVotes);
  const worldCup = getWorldCupSettings(settings);

  const activeGraphMatch =
    worldCup.graph.matches.find((match) => match.id === worldCup.activePollMatchId) ||
    worldCup.graph.matches.find((match) => match.countryA && match.countryB) ||
    null;

  const matchId = normalizeText(extra.nextMatchId) || activeGraphMatch?.id || "next-match";

  const teamAName =
    normalizeText(extra.nextMatchTeamAName) ||
    normalizeText(activeGraphMatch?.countryA?.name) ||
    "";
  const teamBName =
    normalizeText(extra.nextMatchTeamBName) ||
    normalizeText(activeGraphMatch?.countryB?.name) ||
    "";

  const teamAFlagImageUrl = normalizeText(extra.nextMatchTeamAFlagImageUrl);
  const teamBFlagImageUrl = normalizeText(extra.nextMatchTeamBFlagImageUrl);

  const matchVotes = votes[matchId] || { a: 0, b: 0 };

  return {
    matchId,
    teamA: {
      name: teamAName,
      flagImageUrl: teamAFlagImageUrl,
    },
    teamB: {
      name: teamBName,
      flagImageUrl: teamBFlagImageUrl,
    },
    votes: matchVotes,
    hasTeams: !!teamAName && !!teamBName,
  };
}

export function getRankingsSettings(settings: SiteSettings): RankingsSettings {
  const raw = normalizeText(settings.extra.rankingsJson);
  const parsed = parseRankingsJsonText(raw);
  const data = parsed || getDefaultRankingsData();

  return {
    ...data,
    rankingsJson: raw || DEFAULT_RANKINGS_JSON,
  };
}

function defaultCoverPage(): CoverPageSettings {
  return {
    title: "",
    subtitle: "",
    image_url: "",
    video_url: "",
    cta_label: "",
    cta_url: "",
  };
}

function toSettings(doc: SiteSettingsDoc): SiteSettings {
  return {
    id: doc.id,
    coverPage: {
      ...defaultCoverPage(),
      ...(doc.coverPage || {}),
    },
    extra: doc.extra && typeof doc.extra === "object" ? doc.extra : {},
    updated_at: doc.updated_at,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const col = await collection();
  const doc = await col.findOne({ id: SETTINGS_ID });
  if (!doc) {
    return {
      id: SETTINGS_ID,
      coverPage: defaultCoverPage(),
      extra: {},
      updated_at: new Date().toISOString(),
    };
  }
  return toSettings(doc);
}

export async function updateSiteSettings(input: {
  coverPage?: Partial<CoverPageSettings>;
  extra?: Record<string, unknown>;
}): Promise<SiteSettings> {
  const col = await collection();
  const existing = await getSiteSettings();
  const now = new Date().toISOString();

  const next: SiteSettings = {
    ...existing,
    coverPage: {
      ...existing.coverPage,
      ...(input.coverPage || {}),
    },
    extra: {
      ...existing.extra,
      ...(input.extra || {}),
    },
    updated_at: now,
  };

  next.coverPage = {
    title: normalizeText(next.coverPage.title),
    subtitle: normalizeText(next.coverPage.subtitle),
    image_url: normalizeText(next.coverPage.image_url),
    video_url: normalizeText(next.coverPage.video_url),
    cta_label: normalizeText(next.coverPage.cta_label),
    cta_url: normalizeText(next.coverPage.cta_url),
  };

  await col.updateOne(
    { id: SETTINGS_ID },
    { $set: next },
    { upsert: true },
  );

  return next;
}

export async function incrementWorldCupVote(matchId: string, side: "a" | "b"): Promise<SiteSettings> {
  const cleanedMatchId = normalizeText(matchId);
  if (!cleanedMatchId) {
    throw new Error("Invalid match ID");
  }

  const now = new Date().toISOString();
  const col = await collection();

  await col.updateOne(
    { id: SETTINGS_ID },
    {
      $setOnInsert: {
        id: SETTINGS_ID,
        coverPage: defaultCoverPage(),
      },
      $inc: {
        [`extra.worldCupVotes.${cleanedMatchId}.${side}`]: 1,
      },
      $set: { updated_at: now },
    },
    { upsert: true },
  );

  const next = await col.findOne({ id: SETTINGS_ID });
  if (!next) {
    return {
      id: SETTINGS_ID,
      coverPage: defaultCoverPage(),
      extra: {},
      updated_at: now,
    };
  }

  return toSettings(next);
}

