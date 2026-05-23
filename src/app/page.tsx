import type { Metadata } from "next";
import { listBlogPosts } from "@/lib/blogPosts";
import { listCategories } from "@/lib/categories";
import { getHomePostSelections, getNextMatchSettings, getSiteSettings } from "@/lib/siteSettings";
import HeroSection from "./components/HeroSection";
import CategoryGrid from "./components/CategoryGrid";
import BlogCard from "./components/BlogCard";
import SidebarBlock from "./components/SidebarBlock";
import WorldCupBracketGame from "./components/WorldCupBracketGame";

export const metadata: Metadata = {
  title: "KickInfoMedia â€” Breaking Football News, Transfers & Analysis",
  description: "The premier destination for breaking football news, tactical analysis, and live coverage from across the globe.",
};

export default async function Home() {
  const posts = await listBlogPosts({ publishedOnly: true });
  const categories = await listCategories();
  const settings = await getSiteSettings();
  const homeSelections = getHomePostSelections(settings);
  const nextMatch = getNextMatchSettings(settings);

  const categoryMap = new Map<string, string>();
  const categoryCounts = new Map<string, number>();

  for (const cat of categories) {
    categoryMap.set(cat.id, cat.name);
    categoryCounts.set(cat.id, 0);
  }

  for (const post of posts) {
    if (post.category_id && categoryCounts.has(post.category_id)) {
      categoryCounts.set(post.category_id, categoryCounts.get(post.category_id)! + 1);
    }
  }

  const postsById = new Map(posts.map((post) => [post.id, post]));
  const pickPosts = (selectedIds: string[], count: number, fallbackPosts: typeof posts) => {
    const selected: typeof posts = [];
    for (const id of selectedIds) {
      const post = postsById.get(id);
      if (post && !selected.some((item) => item.id === post.id)) selected.push(post);
    }
    const selectedIdsSet = new Set(selected.map((post) => post.id));
    const fallback = fallbackPosts.filter((post) => !selectedIdsSet.has(post.id));
    return [...selected, ...fallback].slice(0, count);
  };

  const heroPosts = pickPosts(homeSelections.heroPostIds, 4, posts);
  const topStoryPosts = pickPosts(homeSelections.topStoryPostIds, 4, posts);
  const highlightPosts = posts.filter((post) => post.highlight).slice(0, 6);

  const heroPostsData = heroPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImageUrl: post.cover_image_url,
    categoryName: categoryMap.get(post.category_id),
    createdAt: post.created_at,
  }));

  const trendingPosts = topStoryPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    categoryName: categoryMap.get(post.category_id),
  }));

  const categoryGridData = categories.map((cat) => ({
    slug: cat.slug,
    name: cat.name,
    imageUrl: cat.image_url,
    articleCount: categoryCounts.get(cat.id) || 0,
  }));

  return (
    <main>
      <HeroSection posts={heroPostsData} />
      <CategoryGrid categories={categoryGridData} />

      <section className="lower">
        <div className="editor-block">
          <div className="section-head" style={{ marginBottom: "8px" }}>
            <span className="section-label">World Cup Game</span>
            <div className="section-line"></div>
          </div>
          <h3 className="editor-title">FIFA World Cup Next Match Poll</h3>
          <p className="editor-desc">Pick your winner for the next match and watch live vote percentages update.</p>
          <WorldCupBracketGame
            matchId={nextMatch.matchId}
            teamA={nextMatch.teamA}
            teamB={nextMatch.teamB}
            initialVotes={{ [nextMatch.matchId]: nextMatch.votes }}
          />
        </div>

        <aside className="sidebar">
          <SidebarBlock trendingPosts={trendingPosts} />
        </aside>
      </section>

      <section className="blog">
        <div className="blog-head">
          <div>
            <p className="blog-sub">Highlights</p>
            <h2 className="blog-title">Featured Stories</h2>
          </div>
        </div>
        {highlightPosts.length > 0 ? (
          <div className="blog-grid">
            {highlightPosts.map((post, index) => (
              <BlogCard
                key={post.id}
                slug={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                coverImageUrl={post.cover_image_url}
                categoryName={categoryMap.get(post.category_id)}
                published={post.published}
                createdAt={post.created_at}
                accentColor={index % 2 !== 0 ? "green" : "blue"}
              />
            ))}
          </div>
        ) : (
          <div className="admin-panel">
            <p className="empty-state-desc">No highlighted posts yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}
