import { randomUUID } from "crypto";
import { getMongoDb } from "@/lib/mongodb";
import type { Filter } from "mongodb";
import { TEAM_GROUPS, type TeamGroup } from "@/lib/teamGroups";

export type Team = {
  id: string;
  group: TeamGroup;
  country: string;
  description: string;
  cover_image_url: string;
  team_image_url: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

type TeamDoc = Team & {
  _id?: unknown;
  name?: string; // legacy field kept for backwards compatibility with existing documents
  image_url?: string; // legacy single-image field
};

function collection() {
  return getMongoDb().then((db) => db.collection<TeamDoc>("teams"));
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeGroup(value: unknown): TeamGroup {
  const input = normalizeText(value);
  if (TEAM_GROUPS.includes(input as TeamGroup)) return input as TeamGroup;
  return "Group A";
}

function getGroupOrder(group: TeamGroup): number {
  const index = TEAM_GROUPS.indexOf(group);
  return index >= 0 ? index : 999;
}

function normalizeSlugPart(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function teamCountryToSlug(country: string): string {
  return normalizeSlugPart(
    country
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/['’]/g, ""),
  );
}

function toTeam(doc: TeamDoc): Team {
  const now = new Date().toISOString();
  const group = normalizeGroup(doc.group);
  const country = normalizeText(doc.country) || normalizeText(doc.name);
  const coverImageUrl = normalizeText(doc.cover_image_url) || normalizeText(doc.image_url);
  const teamImageUrl = normalizeText(doc.team_image_url) || normalizeText(doc.image_url) || coverImageUrl;
  return {
    id: doc.id,
    group,
    country,
    description: doc.description || "",
    cover_image_url: coverImageUrl,
    team_image_url: teamImageUrl,
    published: !!doc.published,
    created_at: doc.created_at || now,
    updated_at: doc.updated_at || now,
  };
}

export async function listTeams(options?: { publishedOnly?: boolean }): Promise<Team[]> {
  const col = await collection();
  const filter: Filter<TeamDoc> = {};
  if (options?.publishedOnly) filter.published = true;
  const docs = await col.find(filter).sort({ created_at: 1 }).toArray();
  return docs
    .map(toTeam)
    .sort((a, b) => {
      const groupDiff = getGroupOrder(a.group) - getGroupOrder(b.group);
      if (groupDiff !== 0) return groupDiff;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
}

export async function getTeamById(id: string): Promise<Team | null> {
  const col = await collection();
  const doc = await col.findOne({ id });
  return doc ? toTeam(doc) : null;
}

export async function getTeamBySlug(slug: string): Promise<Team | null> {
  const normalized = normalizeSlugPart(slug);
  if (!normalized) return null;

  const teams = await listTeams();
  return teams.find((team) => teamCountryToSlug(team.country) === normalized) || null;
}

export async function getTeamBySlugOrId(value: string): Promise<Team | null> {
  const bySlug = await getTeamBySlug(value);
  if (bySlug) return bySlug;
  return getTeamById(value);
}

export async function createTeam(input: {
  group: TeamGroup;
  country: string;
  description?: string;
  cover_image_url?: string;
  team_image_url?: string;
  published?: boolean;
}): Promise<Team> {
  const col = await collection();
  const now = new Date().toISOString();
  const coverImageUrl = normalizeText(input.cover_image_url);
  const teamImageUrl = normalizeText(input.team_image_url);
  const team: Team = {
    id: randomUUID(),
    group: normalizeGroup(input.group),
    country: normalizeText(input.country),
    description: input.description || "",
    cover_image_url: coverImageUrl,
    team_image_url: teamImageUrl,
    published: !!input.published,
    created_at: now,
    updated_at: now,
  };

  await col.insertOne(team);
  return team;
}

export async function updateTeam(
  id: string,
  input: {
    group: TeamGroup;
    country: string;
    description?: string;
    cover_image_url?: string;
    team_image_url?: string;
    published?: boolean;
  },
): Promise<Team | null> {
  const col = await collection();
  const next = {
    group: normalizeGroup(input.group),
    country: normalizeText(input.country),
    description: input.description || "",
    cover_image_url: normalizeText(input.cover_image_url),
    team_image_url: normalizeText(input.team_image_url),
    published: !!input.published,
    updated_at: new Date().toISOString(),
  };

  const result = await col.findOneAndUpdate(
    { id },
    { $set: next },
    { returnDocument: "after" },
  );

  return result ? toTeam(result) : null;
}

export async function deleteTeam(id: string): Promise<boolean> {
  const col = await collection();
  const result = await col.deleteOne({ id });
  return result.deletedCount > 0;
}
