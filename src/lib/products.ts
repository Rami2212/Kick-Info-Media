import { randomUUID } from "crypto";
import type { Filter } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

export type Product = {
  id: string;
  name: string;
  slug: string;
  team: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  cover_image_url: string;
  gallery: string[];
  sizes: string[];
  stock: number;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

type ProductDoc = Product & {
  _id?: unknown;
};

function collection() {
  return getMongoDb().then((db) => db.collection<ProductDoc>("products"));
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCurrency(value: unknown): string {
  const next = normalizeText(value).toUpperCase();
  return next || "USD";
}

function normalizePrice(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function normalizeStock(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeText(entry))
    .filter((entry, index, all) => !!entry && all.indexOf(entry) === index);
}

function toProduct(doc: ProductDoc): Product {
  const now = new Date().toISOString();
  return {
    id: doc.id,
    name: normalizeText(doc.name),
    slug: normalizeText(doc.slug),
    team: normalizeText(doc.team),
    category: normalizeText(doc.category),
    description: doc.description || "",
    price: normalizePrice(doc.price),
    currency: normalizeCurrency(doc.currency),
    cover_image_url: normalizeText(doc.cover_image_url),
    gallery: normalizeStringArray(doc.gallery),
    sizes: normalizeStringArray(doc.sizes),
    stock: normalizeStock(doc.stock),
    published: !!doc.published,
    featured: !!doc.featured,
    created_at: doc.created_at || now,
    updated_at: doc.updated_at || now,
  };
}

export async function listProducts(options?: {
  publishedOnly?: boolean;
  team?: string;
  category?: string;
  size?: string;
  query?: string;
  limit?: number;
}): Promise<Product[]> {
  const col = await collection();
  const filter: Filter<ProductDoc> = {};
  if (options?.publishedOnly) filter.published = true;
  if (options?.team) filter.team = normalizeText(options.team);
  if (options?.category) filter.category = normalizeText(options.category);
  if (options?.size) filter.sizes = normalizeText(options.size);

  const cursor = col.find(filter).sort({ created_at: -1 });
  if (options?.limit && options.limit > 0) cursor.limit(options.limit);
  let docs = (await cursor.toArray()).map(toProduct);

  const query = normalizeText(options?.query).toLowerCase();
  if (query) {
    docs = docs.filter((product) =>
      [
        product.name,
        product.team,
        product.category,
        product.description.replace(/<[^>]*>/g, " "),
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }

  return docs;
}

export async function getProductById(id: string): Promise<Product | null> {
  const col = await collection();
  const doc = await col.findOne({ id });
  return doc ? toProduct(doc) : null;
}

export async function getProductBySlug(slug: string, publishedOnly = false): Promise<Product | null> {
  const col = await collection();
  const filter = publishedOnly ? { slug, published: true } : { slug };
  const doc = await col.findOne(filter);
  return doc ? toProduct(doc) : null;
}

export async function createProduct(input: {
  name: string;
  slug: string;
  team?: string;
  category?: string;
  description?: string;
  price: number;
  currency?: string;
  cover_image_url?: string;
  gallery?: string[];
  sizes?: string[];
  stock?: number;
  published?: boolean;
  featured?: boolean;
}): Promise<Product> {
  const col = await collection();
  const now = new Date().toISOString();

  const product: Product = {
    id: randomUUID(),
    name: normalizeText(input.name),
    slug: normalizeText(input.slug),
    team: normalizeText(input.team),
    category: normalizeText(input.category),
    description: input.description || "",
    price: normalizePrice(input.price),
    currency: normalizeCurrency(input.currency),
    cover_image_url: normalizeText(input.cover_image_url),
    gallery: normalizeStringArray(input.gallery),
    sizes: normalizeStringArray(input.sizes),
    stock: normalizeStock(input.stock),
    published: !!input.published,
    featured: !!input.featured,
    created_at: now,
    updated_at: now,
  };

  await col.insertOne(product);
  return product;
}

export async function updateProduct(
  id: string,
  input: {
    name: string;
    slug: string;
    team?: string;
    category?: string;
    description?: string;
    price: number;
    currency?: string;
    cover_image_url?: string;
    gallery?: string[];
    sizes?: string[];
    stock?: number;
    published?: boolean;
    featured?: boolean;
  },
): Promise<Product | null> {
  const col = await collection();
  const next = {
    name: normalizeText(input.name),
    slug: normalizeText(input.slug),
    team: normalizeText(input.team),
    category: normalizeText(input.category),
    description: input.description || "",
    price: normalizePrice(input.price),
    currency: normalizeCurrency(input.currency),
    cover_image_url: normalizeText(input.cover_image_url),
    gallery: normalizeStringArray(input.gallery),
    sizes: normalizeStringArray(input.sizes),
    stock: normalizeStock(input.stock),
    published: !!input.published,
    featured: !!input.featured,
    updated_at: new Date().toISOString(),
  };

  const result = await col.findOneAndUpdate(
    { id },
    { $set: next },
    { returnDocument: "after" },
  );

  return result ? toProduct(result) : null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const col = await collection();
  const result = await col.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function productSlugExists(slug: string, excludeId?: string): Promise<boolean> {
  const col = await collection();
  const filter = excludeId ? { slug, id: { $ne: excludeId } } : { slug };
  const existing = await col.findOne(filter, { projection: { id: 1 } });
  return !!existing;
}

