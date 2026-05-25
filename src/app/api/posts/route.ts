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
import { enforceSameOrigin, sanitizeRichHtml } from "@/lib/security";

function resolveSlug(inputSlug: string | undefined, title: string) {
  const normalized = slugify((inputSlug || "").trim());
  if (normalized) return normalized;
  return `${slugify(title)}-${Date.now().toString(36)}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const all = searchParams.get("all"); // admin only fetches unpublished too
  const includeUnpublished = !!all;

  if (includeUnpublished) {
    const admin = await requireAdminAuth();
    if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (slug) {
    const post = await getBlogPostBySlug(slug, !includeUnpublished);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
  }

  const posts = await listBlogPosts({ publishedOnly: !includeUnpublished });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

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
    highlight,
    seo_description,
    seo_keywords,
    meta_description,
    meta_keywords,
  } = body;

  const safeTitle = typeof title === "string" ? title.trim().slice(0, 180) : "";
  const safeExcerpt = typeof excerpt === "string" ? excerpt.trim().slice(0, 1000) : "";
  const safeContent = typeof content === "string" ? sanitizeRichHtml(content) : "";
  if (!safeTitle || !safeContent) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }

  const slug = resolveSlug(customSlug, safeTitle);
  if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const exists = await blogSlugExists(slug);
  if (exists) {
    return NextResponse.json({ error: "Slug already exists. Please choose another." }, { status: 409 });
  }

  const post = await createBlogPost({
    title: safeTitle,
    slug,
    excerpt: safeExcerpt,
    content: safeContent,
    cover_image_url,
    category_id,
    media,
    published: !!published,
    highlight: !!highlight,
    seo_description: seo_description ?? meta_description,
    seo_keywords: seo_keywords ?? meta_keywords,
  });

  return NextResponse.json(post, { status: 201 });
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
    title,
    slug: customSlug,
    excerpt,
    content,
    cover_image_url,
    category_id,
    media,
    published,
    highlight,
    seo_description,
    seo_keywords,
    meta_description,
    meta_keywords,
  } = body;

  const safeTitle = typeof title === "string" ? title.trim().slice(0, 180) : "";
  const safeExcerpt = typeof excerpt === "string" ? excerpt.trim().slice(0, 1000) : "";
  const safeContent = typeof content === "string" ? sanitizeRichHtml(content) : "";
  if (!safeTitle || !safeContent) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }

  const slug = resolveSlug(customSlug, safeTitle);
  if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const exists = await blogSlugExists(slug, id);
  if (exists) {
    return NextResponse.json({ error: "Slug already exists. Please choose another." }, { status: 409 });
  }

  const post = await updateBlogPost(id, {
    title: safeTitle,
    slug,
    excerpt: safeExcerpt,
    content: safeContent,
    cover_image_url,
    category_id,
    media,
    published: !!published,
    highlight: !!highlight,
    seo_description: seo_description ?? meta_description,
    seo_keywords: seo_keywords ?? meta_keywords,
  });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function DELETE(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const admin = await requireAdminAuth();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const deleted = await deleteBlogPost(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
