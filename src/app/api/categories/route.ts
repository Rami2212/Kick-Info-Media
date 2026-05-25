import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/adminAuth";
import {
  categorySlugExists,
  createCategory,
  deleteCategory,
  getCategoryById,
  getCategoryBySlug,
  listCategories,
  updateCategory,
} from "@/lib/categories";
import { slugify } from "@/lib/utils";
import { enforceSameOrigin } from "@/lib/security";

function resolveSlug(inputSlug: string | undefined, name: string) {
  const normalized = slugify((inputSlug || "").trim());
  if (normalized) return normalized;
  return `${slugify(name)}-${Date.now().toString(36)}`;
}

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const id = searchParams.get("id");

  if (id) {
    const category = await getCategoryById(id);
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(category);
  }

  if (slug) {
    const category = await getCategoryBySlug(slug);
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(category);
  }

  const categories = await listCategories();
  return NextResponse.json(categories);
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
    description,
    image_url,
    seo_description,
    seo_keywords,
  } = body;

  const safeName = typeof name === "string" ? name.trim().slice(0, 120) : "";
  const safeDescription = typeof description === "string" ? description.trim().slice(0, 1200) : "";
  if (!safeName) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const slug = resolveSlug(customSlug, safeName);
  if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const exists = await categorySlugExists(slug);
  if (exists) {
    return NextResponse.json({ error: "Slug already exists. Please choose another." }, { status: 409 });
  }

  const category = await createCategory({
    name: safeName,
    slug,
    description: safeDescription,
    image_url,
    seo_description,
    seo_keywords,
  });

  return NextResponse.json(category, { status: 201 });
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
    description,
    image_url,
    seo_description,
    seo_keywords,
  } = body;

  const safeName = typeof name === "string" ? name.trim().slice(0, 120) : "";
  const safeDescription = typeof description === "string" ? description.trim().slice(0, 1200) : "";
  if (!safeName) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const slug = resolveSlug(customSlug, safeName);
  if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const exists = await categorySlugExists(slug, id);
  if (exists) {
    return NextResponse.json({ error: "Slug already exists. Please choose another." }, { status: 409 });
  }

  const category = await updateCategory(id, {
    name: safeName,
    slug,
    description: safeDescription,
    image_url,
    seo_description,
    seo_keywords,
  });

  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(category);
}

export async function DELETE(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const admin = await requireAdminAuth();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const deleted = await deleteCategory(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}

