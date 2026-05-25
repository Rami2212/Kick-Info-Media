import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/adminAuth";
import { slugify } from "@/lib/utils";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductBySlug,
  listProducts,
  productSlugExists,
  updateProduct,
} from "@/lib/products";
import { enforceSameOrigin, sanitizeRichHtml } from "@/lib/security";

export const runtime = "nodejs";

function resolveSlug(inputSlug: string | undefined, name: string) {
  const normalized = slugify((inputSlug || "").trim());
  if (normalized) return normalized;
  return `${slugify(name)}-${Date.now().toString(36)}`;
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => !!entry);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");
  const all = searchParams.get("all");
  const includeUnpublished = !!all;
  const team = searchParams.get("team") || "";
  const category = searchParams.get("category") || "";
  const size = searchParams.get("size") || "";
  const query = searchParams.get("q") || "";

  if (includeUnpublished) {
    const admin = await requireAdminAuth();
    if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (id) {
    const admin = await requireAdminAuth();
    if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const product = await getProductById(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  }

  if (slug) {
    const product = await getProductBySlug(slug, !includeUnpublished);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  }

  const products = await listProducts({
    publishedOnly: !includeUnpublished,
    team,
    category,
    size,
    query,
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const admin = await requireAdminAuth();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name,
    slug: customSlug,
    team,
    category,
    description,
    price,
    currency,
    cover_image_url,
    gallery,
    sizes,
    stock,
    published,
    featured,
  } = body || {};

  const safeName = typeof name === "string" ? name.trim().slice(0, 160) : "";
  const safeDescription = typeof description === "string" ? sanitizeRichHtml(description) : "";
  const safeTeam = typeof team === "string" ? team.trim().slice(0, 120) : "";
  const safeCategory = typeof category === "string" ? category.trim().slice(0, 120) : "";
  const safeCurrency = typeof currency === "string" ? currency.trim().toUpperCase().slice(0, 3) : "USD";

  const priceNumber = Number(price);
  if (!safeName || !Number.isFinite(priceNumber) || priceNumber < 0) {
    return NextResponse.json({ error: "Name and price are required." }, { status: 400 });
  }

  const slug = resolveSlug(customSlug, safeName);
  if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const exists = await productSlugExists(slug);
  if (exists) {
    return NextResponse.json({ error: "Slug already exists. Please choose another." }, { status: 409 });
  }

  const product = await createProduct({
    name: safeName,
    slug,
    team: safeTeam,
    category: safeCategory,
    description: safeDescription,
    price: priceNumber,
    currency: safeCurrency || "USD",
    cover_image_url,
    gallery: parseStringArray(gallery),
    sizes: parseStringArray(sizes),
    stock,
    published: !!published,
    featured: !!featured,
  });

  return NextResponse.json(product, { status: 201 });
}

export async function PUT(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const admin = await requireAdminAuth();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const body = await req.json();
  const {
    name,
    slug: customSlug,
    team,
    category,
    description,
    price,
    currency,
    cover_image_url,
    gallery,
    sizes,
    stock,
    published,
    featured,
  } = body || {};

  const safeName = typeof name === "string" ? name.trim().slice(0, 160) : "";
  const safeDescription = typeof description === "string" ? sanitizeRichHtml(description) : "";
  const safeTeam = typeof team === "string" ? team.trim().slice(0, 120) : "";
  const safeCategory = typeof category === "string" ? category.trim().slice(0, 120) : "";
  const safeCurrency = typeof currency === "string" ? currency.trim().toUpperCase().slice(0, 3) : "USD";

  const priceNumber = Number(price);
  if (!safeName || !Number.isFinite(priceNumber) || priceNumber < 0) {
    return NextResponse.json({ error: "Name and price are required." }, { status: 400 });
  }

  const slug = resolveSlug(customSlug, safeName);
  if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const exists = await productSlugExists(slug, id);
  if (exists) {
    return NextResponse.json({ error: "Slug already exists. Please choose another." }, { status: 409 });
  }

  const product = await updateProduct(id, {
    name: safeName,
    slug,
    team: safeTeam,
    category: safeCategory,
    description: safeDescription,
    price: priceNumber,
    currency: safeCurrency || "USD",
    cover_image_url,
    gallery: parseStringArray(gallery),
    sizes: parseStringArray(sizes),
    stock,
    published: !!published,
    featured: !!featured,
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function DELETE(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const admin = await requireAdminAuth();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const deleted = await deleteProduct(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
