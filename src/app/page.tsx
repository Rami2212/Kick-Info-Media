import { listBlogPosts } from "@/lib/blogPosts";
import { listCategories } from "@/lib/categories";
import HeroSection from "./components/HeroSection";
import CategoryGrid from "./components/CategoryGrid";
import BlogCard from "./components/BlogCard";
import SidebarBlock from "./components/SidebarBlock";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KickInfoMedia — Breaking Football News, Transfers & Analysis",
  description: "The premier destination for breaking football news, tactical analysis, and live coverage from across the globe.",
};

export default async function Home() {
  const posts = await listBlogPosts({ publishedOnly: true });
  const categories = await listCategories();

  const categoryMap = new Map<string, string>();
  const categoryCounts = new Map<string, number>();

  for (const cat of categories) {
    categoryMap.set(cat.id, cat.name);
    categoryCounts.set(cat.id, 0);
  }

  // Calculate article counts per category
  for (const post of posts) {
    if (post.category_id && categoryCounts.has(post.category_id)) {
      categoryCounts.set(post.category_id, categoryCounts.get(post.category_id)! + 1);
    }
  }

  // Format data for components
  const heroPostsData = posts.slice(0, 4).map(post => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    categoryName: categoryMap.get(post.category_id),
    createdAt: post.created_at,
  }));

  const latestPosts = posts.length >= 4 ? posts.slice(4, 10) : posts;
  
  const trendingPosts = posts.slice(0, 5).map(post => ({
    slug: post.slug,
    title: post.title,
    categoryName: categoryMap.get(post.category_id),
  }));

  const editorPosts = posts.length >= 8 ? posts.slice(4, 8) : posts.slice(0, 4);

  const categoryGridData = categories.map(cat => ({
    slug: cat.slug,
    name: cat.name,
    articleCount: categoryCounts.get(cat.id) || 0,
  }));

  return (
    <main>
      <HeroSection posts={heroPostsData} />
      <CategoryGrid categories={categoryGridData} />

      <section className="blog">
        <div className="blog-head">
          <div>
            <p className="blog-sub">What's New</p>
            <h2 className="blog-title">Latest Articles</h2>
          </div>
          {/* Note: Filters require client components to be interactive, so they are omitted from the server component for now, as requested. */}
        </div>
        <div className="blog-grid">
          {latestPosts.map((post, index) => (
            <BlogCard
              key={post.id}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              categoryName={categoryMap.get(post.category_id)}
              published={post.published}
              createdAt={post.created_at}
              accentColor={index % 2 !== 0 ? 'green' : 'blue'}
            />
          ))}
        </div>
      </section>

      <section className="lower">
        <div className="editor-block">
          <div className="section-head" style={{ marginBottom: '8px' }}>
            <span className="section-label">More Coverage</span>
            <div className="section-line"></div>
          </div>
          <h3 className="editor-title">Editor Highlights</h3>
          <p className="editor-desc">Quick reads, tactical breakdowns, and expert analysis from across the football world.</p>
          <div className="editor-grid">
            {editorPosts.map(post => (
              <Link key={`editor-${post.id}`} href={`/posts/${post.slug}`} className="editor-item">
                <p className="editor-item-title">{post.title}</p>
                <p className="editor-item-excerpt">
                  {post.excerpt.length > 100 ? `${post.excerpt.substring(0, 100)}...` : post.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <aside className="sidebar">
          <SidebarBlock trendingPosts={trendingPosts} />
        </aside>
      </section>
    </main>
  );
}
