import { randomUUID } from "crypto";
import { getMongoDb } from "@/lib/mongodb";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  seo_description: string;
  seo_keywords: string;
  created_at: string;
  updated_at: string;
};

type CategoryDoc = Category & {
  _id?: unknown;
};

function collection() {
  return getMongoDb().then((db) => db.collection<CategoryDoc>("categories"));
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toCategory(doc: CategoryDoc): Category {
  return {
    id: doc.id,
    name: doc.name,
    slug: doc.slug,
    description: doc.description || "",
    image_url: doc.image_url || "",
    seo_description: doc.seo_description || "",
    seo_keywords: doc.seo_keywords || "",
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };
}

export async function listCategories(): Promise<Category[]> {
  const col = await collection();
  const docs = await col.find().sort({ created_at: -1 }).toArray();
  return docs.map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const col = await collection();
  const doc = await col.findOne({ slug });
  return doc ? toCategory(doc) : null;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const col = await collection();
  const doc = await col.findOne({ id });
  return doc ? toCategory(doc) : null;
}

export async function categorySlugExists(slug: string, excludeId?: string): Promise<boolean> {
  const col = await collection();
  const filter = excludeId ? { slug, id: { $ne: excludeId } } : { slug };
  const existing = await col.findOne(filter, { projection: { id: 1 } });
  return !!existing;
}

export async function createCategory(input: {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  seo_description?: string;
  seo_keywords?: string;
}): Promise<Category> {
  const col = await collection();
  const now = new Date().toISOString();
  const category: Category = {
    id: randomUUID(),
    name: normalizeText(input.name),
    slug: normalizeText(input.slug),
    description: normalizeText(input.description),
    image_url: normalizeText(input.image_url),
    seo_description: normalizeText(input.seo_description),
    seo_keywords: normalizeText(input.seo_keywords),
    created_at: now,
    updated_at: now,
  };

  await col.insertOne(category);
  return category;
}

export async function updateCategory(
  id: string,
  input: {
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    seo_description?: string;
    seo_keywords?: string;
  },
): Promise<Category | null> {
  const col = await collection();
  const next = {
    name: normalizeText(input.name),
    slug: normalizeText(input.slug),
    description: normalizeText(input.description),
    image_url: normalizeText(input.image_url),
    seo_description: normalizeText(input.seo_description),
    seo_keywords: normalizeText(input.seo_keywords),
    updated_at: new Date().toISOString(),
  };

  const result = await col.findOneAndUpdate(
    { id },
    { $set: next },
    { returnDocument: "after" },
  );

  return result ? toCategory(result) : null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const col = await collection();
  const result = await col.deleteOne({ id });
  return result.deletedCount > 0;
}

