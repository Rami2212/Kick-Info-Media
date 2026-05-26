import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listBlogPosts } from "@/lib/blogPosts";
import { getCategoryBySlug, listCategories } from "@/lib/categories";
import BlogCard from "../../components/BlogCard";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords, splitSeoKeywords } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: "Category Not Found" };
  }

  return {
    title: `${category.name} News - KickInfoMedia`,
    description: category.seo_description || category.description,
    keywords: mergeSeoKeywords(splitSeoKeywords(category.seo_keywords), SEO_DEFAULT_KEYWORDS),
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const posts = await listBlogPosts({
    publishedOnly: true,
    categoryId: category.id,
  });

  const categories = await listCategories();
  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat.name);
  }

  return (
    <>
      <div className="divider"></div>
      <div className="category-page">
        <header className="category-header">
          <p className="category-page-count">{posts.length} articles</p>
          <h1 className="category-page-title">{category.name}</h1>
          <p className="category-page-desc">{category.description}</p>
        </header>

        {posts.length > 0 ? (
          <div className="blog-grid">
            {posts.map((post, index) => (
              <BlogCard
                key={post.id}
                slug={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                categoryName={categoryMap.get(post.category_id)}
                published={post.published}
                createdAt={post.created_at}
                accentColor={index % 2 !== 0 ? "green" : "blue"}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2 className="empty-state-title">No articles found</h2>
            <p className="empty-state-desc">Check back later for news in this category.</p>
          </div>
        )}
      </div>
    </>
  );
}
