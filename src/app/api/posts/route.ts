import { requireAdminAuth } from "@/lib/adminAuth";
import {
  blogSlugExists,
  createBlogPost,
  deleteBlogPost,
  getBlogPostBySlug,
  listBlogPosts,
  updateBlogPost,
} from "@/lib/blogPosts";
import { NextResponse } from "next/server";
import { slugify } from "@/lib/utils";

function resolveSlug(inputSlug: string | undefined, title: string) {
  const normalized = slugify((inputSlug || "").trim());
  if (normalized) return normalized;
  return `${slugify(title)}-${Date.now().toString(36)}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const all = searchParams.get("all"); // admin only fetches unpublished too

  if (slug) {
    const post = await getBlogPostBySlug(slug, !all);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
  }

  const posts = await listBlogPosts({ publishedOnly: !all });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const admin = await requireAdminAuth();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title,
    slug: customSlug,
    excerpt,
    content,
    cover_image_url,
    category_id,
    media,
    published,
    seo_description,
    seo_keywords,
    meta_description,
    meta_keywords,
  } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }

  const slug = resolveSlug(customSlug, title);
  if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const exists = await blogSlugExists(slug);
  if (exists) {
    return NextResponse.json({ error: "Slug already exists. Please choose another." }, { status: 409 });
  }

  const post = await createBlogPost({
    title,
    slug,
    excerpt,
    content,
    cover_image_url,
    category_id,
    media,
    published: !!published,
    seo_description: seo_description ?? meta_description,
    seo_keywords: seo_keywords ?? meta_keywords,
  });

  return NextResponse.json(post, { status: 201 });
}

export async function PUT(req: Request) {
  const admin = await requireAdminAuth();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const body = await req.json();
  const {
    title,
    slug: customSlug,
    excerpt,
    content,
    cover_image_url,
    category_id,
    media,
    published,
    seo_description,
    seo_keywords,
    meta_description,
    meta_keywords,
  } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }

  const slug = resolveSlug(customSlug, title);
  if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const exists = await blogSlugExists(slug, id);
  if (exists) {
    return NextResponse.json({ error: "Slug already exists. Please choose another." }, { status: 409 });
  }

  const post = await updateBlogPost(id, {
    title,
    slug,
    excerpt,
    content,
    cover_image_url,
    category_id,
    media,
    published: !!published,
    seo_description: seo_description ?? meta_description,
    seo_keywords: seo_keywords ?? meta_keywords,
  });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function DELETE(req: Request) {
  const admin = await requireAdminAuth();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const deleted = await deleteBlogPost(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
