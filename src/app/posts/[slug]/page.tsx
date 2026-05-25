import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPostBySlug } from "@/lib/blogPosts";
import { getCategoryById } from "@/lib/categories";
import { AdSideRail } from "@/app/components/ads/Ads";
import { sanitizeRichHtml } from "@/lib/security";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug, true);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} - KickInfoMedia`,
    description: post.seo_description || post.excerpt,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug, true);

  if (!post) {
    notFound();
  }

  let categoryName = "Article";
  let categorySlug = "";
  if (post.category_id) {
    const category = await getCategoryById(post.category_id);
    if (category) {
      categoryName = category.name;
      categorySlug = category.slug;
    }
  }

  const dateStr = new Date(post.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="divider"></div>
      <div className="post-page">
        <aside className="post-page-side post-page-side-left">
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        </aside>

        <article className="post-main">
          <div className="post-breadcrumb">
            <Link href="/">Home</Link>
            <span>{">"}</span>
            {categorySlug ? (
              <>
                <Link href={`/category/${categorySlug}`}>{categoryName}</Link>
                <span>{">"}</span>
              </>
            ) : null}
            <span>Article</span>
          </div>

          <header className="post-header">
            <span className="badge badge-blue">{categoryName}</span>
            <h1 className="post-page-title">{post.title}</h1>
            <p className="post-page-excerpt">{post.excerpt}</p>
            <div className="post-meta-bar">
              <span className="author-name">Editorial Team</span>
              <span>.</span>
              <span>{dateStr}</span>
              <span>.</span>
              <span>{Math.max(1, Math.ceil(post.content.length / 1000))} min read</span>
            </div>
          </header>

          {post.cover_image_url && (
            <img className="post-cover-img" src={post.cover_image_url} alt={post.title} />
          )}

          <div className="post-body" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.content || "") }} />

          {post.media && post.media.length > 0 && (
            <div className="post-media">
              {post.media.map((item, idx) =>
                item.type === "video" ? (
                  <video key={idx} src={item.url} controls />
                ) : (
                  <img key={idx} src={item.url} alt={`Media ${idx + 1}`} />
                ),
              )}
            </div>
          )}
        </article>

        <aside className="post-page-side post-page-side-right">
          <AdSideRail size="160x600" smartLinkLabel="Partner" />
        </aside>
      </div>
    </>
  );
}
