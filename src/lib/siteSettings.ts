import { getMongoDb } from "@/lib/mongodb";

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

