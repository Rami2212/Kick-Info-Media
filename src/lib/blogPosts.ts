import { randomUUID } from "crypto";
import { getMongoDb } from "@/lib/mongodb";
import type { Filter } from "mongodb";

export type BlogMediaItem = {
  url: string;
  type: "image" | "video";
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  category_id: string;
  media: BlogMediaItem[];
  seo_description: string;
  seo_keywords: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

type BlogPostDoc = BlogPost & {
  _id?: unknown;
  meta_description?: string;
  meta_keywords?: string;
};

function collection() {
  return getMongoDb().then((db) => db.collection<BlogPostDoc>("posts"));
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMedia(value: unknown): BlogMediaItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as { url?: unknown; type?: unknown };
      const url = normalizeText(item.url);
      const type = item.type === "video" ? "video" : "image";
      if (!url) return null;
      return { url, type } satisfies BlogMediaItem;
    })
    .filter((entry): entry is BlogMediaItem => !!entry);
}

function toPost(doc: BlogPostDoc): BlogPost {
  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt || "",
    content: doc.content || "",
    cover_image_url: doc.cover_image_url || "",
    category_id: doc.category_id || "",
    media: Array.isArray(doc.media) ? doc.media : [],
    seo_description: doc.seo_description || doc.meta_description || "",
    seo_keywords: doc.seo_keywords || doc.meta_keywords || "",
    published: !!doc.published,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };
}

export async function listBlogPosts(options?: {
  publishedOnly?: boolean;
  limit?: number;
  categoryId?: string;
}): Promise<BlogPost[]> {
  const col = await collection();
  const filter: Filter<BlogPostDoc> = {};
  if (options?.publishedOnly) filter.published = true;
  if (options?.categoryId) filter.category_id = options.categoryId;

  const cursor = col.find(filter).sort({ created_at: -1 });
  if (options?.limit && options.limit > 0) cursor.limit(options.limit);
  const docs = await cursor.toArray();
  return docs.map(toPost);
}

export async function getBlogPostBySlug(slug: string, publishedOnly = false): Promise<BlogPost | null> {
  const col = await collection();
  const filter = publishedOnly ? { slug, published: true } : { slug };
  const doc = await col.findOne(filter);
  return doc ? toPost(doc) : null;
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const col = await collection();
  const doc = await col.findOne({ id });
  return doc ? toPost(doc) : null;
}

export async function countBlogPosts(): Promise<number> {
  const col = await collection();
  return col.countDocuments();
}

export async function createBlogPost(input: {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_image_url?: string;
  category_id?: string;
  media?: BlogMediaItem[];
  published?: boolean;
  seo_description?: string;
  seo_keywords?: string;
}): Promise<BlogPost> {
  const col = await collection();
  const now = new Date().toISOString();
  const post: BlogPost = {
    id: randomUUID(),
    title: normalizeText(input.title),
    slug: normalizeText(input.slug),
    excerpt: normalizeText(input.excerpt),
    content: input.content || "",
    cover_image_url: normalizeText(input.cover_image_url),
    category_id: normalizeText(input.category_id),
    media: normalizeMedia(input.media),
    seo_description: normalizeText(input.seo_description),
    seo_keywords: normalizeText(input.seo_keywords),
    published: !!input.published,
    created_at: now,
    updated_at: now,
  };

  await col.insertOne(post);
  return post;
}

export async function updateBlogPost(
  id: string,
  input: {
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    cover_image_url?: string;
    category_id?: string;
    media?: BlogMediaItem[];
    published?: boolean;
    seo_description?: string;
    seo_keywords?: string;
  },
): Promise<BlogPost | null> {
  const col = await collection();
  const next = {
    title: normalizeText(input.title),
    slug: normalizeText(input.slug),
    excerpt: normalizeText(input.excerpt),
    content: input.content || "",
    cover_image_url: normalizeText(input.cover_image_url),
    category_id: normalizeText(input.category_id),
    media: normalizeMedia(input.media),
    seo_description: normalizeText(input.seo_description),
    seo_keywords: normalizeText(input.seo_keywords),
    published: !!input.published,
    updated_at: new Date().toISOString(),
  };

  const result = await col.findOneAndUpdate(
    { id },
    { $set: next },
    { returnDocument: "after" },
  );

  return result ? toPost(result) : null;
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const col = await collection();
  const result = await col.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function blogSlugExists(slug: string, excludeId?: string): Promise<boolean> {
  const col = await collection();
  const filter = excludeId ? { slug, id: { $ne: excludeId } } : { slug };
  const existing = await col.findOne(filter, { projection: { id: 1 } });
  return !!existing;
}
