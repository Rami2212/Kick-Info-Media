import { listBlogPosts } from "@/lib/blogPosts";
import { listCategories } from "@/lib/categories";
import BlogCard from "../components/BlogCard";
import Link from "next/link";
import { AdSideRail } from "@/app/components/ads/Ads";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    media?: string;
    range?: string;
  }>;
};

export default async function PostsPage({ searchParams }: Props) {
  const { category, sort, media, range } = await searchParams;
  const selectedCategorySlug = typeof category === "string" ? category : "";
  const selectedSort = sort === "oldest" ? "oldest" : "newest";
  const selectedMedia = media === "image" ? "image" : "all";
  const selectedRange = range === "7d" || range === "30d" ? range : "all";

  const [categories, allPosts] = await Promise.all([
    listCategories(),
    listBlogPosts({ publishedOnly: true }),
  ]);

  const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));
  const selectedCategory = categories.find((cat) => cat.slug === selectedCategorySlug);

  const categoryFilteredPosts = selectedCategory
    ? allPosts.filter((post) => post.category_id === selectedCategory.id)
    : allPosts;
  const now = Number(new Date());
  const rangeFilteredPosts = categoryFilteredPosts.filter((post) => {
    if (selectedRange === "all") return true;
    const createdAt = new Date(post.created_at).getTime();
    const days = selectedRange === "7d" ? 7 : 30;
    return now - createdAt <= days * 24 * 60 * 60 * 1000;
  });
  const mediaFilteredPosts = rangeFilteredPosts.filter((post) => {
    if (selectedMedia === "all") return true;
    return typeof post.cover_image_url === "string" && post.cover_image_url.trim().length > 0;
  });
  const filteredPosts = selectedSort === "oldest" ? [...mediaFilteredPosts].reverse() : mediaFilteredPosts;

  const filterHref = (next: {
    category?: string;
    sort?: string;
    media?: string;
    range?: string;
  }) => {
    const params = new URLSearchParams();
    if (next.category && next.category !== "all") params.set("category", next.category);
    if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
    if (next.media && next.media !== "all") params.set("media", next.media);
    if (next.range && next.range !== "all") params.set("range", next.range);
    const query = params.toString();
    return query ? `/posts?${query}` : "/posts";
  };

  const categoryCounts = new Map<string, number>();
  for (const post of allPosts) {
    if (!post.category_id) continue;
    categoryCounts.set(post.category_id, (categoryCounts.get(post.category_id) || 0) + 1);
  }

  return (
    <>
      <div className="divider"></div>
      <section className="posts-page">
        <aside className="posts-filter-sidebar">
          <div className="posts-filter-box">
            <div className="posts-filter-head">
              <div>
                <p className="posts-filter-kicker">Filter</p>
                <h2 className="posts-filter-title">Categories</h2>
              </div>
              <Link href="/posts" className="posts-filter-reset">Reset</Link>
            </div>
            <div className="posts-filter-list">
              <Link
                href={filterHref({ category: "all", sort: selectedSort, media: selectedMedia, range: selectedRange })}
                className={`posts-filter-link ${!selectedCategory ? "active" : ""}`}
              >
                <span>All Posts</span>
                <span>{allPosts.length}</span>
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={filterHref({ category: cat.slug, sort: selectedSort, media: selectedMedia, range: selectedRange })}
                  className={`posts-filter-link ${selectedCategorySlug === cat.slug ? "active" : ""}`}
                >
                  <span>{cat.name}</span>
                  <span>{categoryCounts.get(cat.id) || 0}</span>
                </Link>
              ))}
            </div>

            <div className="posts-filter-group">
              <p className="posts-filter-group-title">Sort</p>
              <div className="posts-filter-chip-row">
                <Link
                  href={filterHref({ category: selectedCategorySlug || "all", sort: "newest", media: selectedMedia, range: selectedRange })}
                  className={`posts-filter-chip ${selectedSort === "newest" ? "active" : ""}`}
                >
                  Newest
                </Link>
                <Link
                  href={filterHref({ category: selectedCategorySlug || "all", sort: "oldest", media: selectedMedia, range: selectedRange })}
                  className={`posts-filter-chip ${selectedSort === "oldest" ? "active" : ""}`}
                >
                  Oldest
                </Link>
              </div>
            </div>

            <div className="posts-filter-group">
              <p className="posts-filter-group-title">Cover Image</p>
              <div className="posts-filter-chip-row">
                <Link
                  href={filterHref({ category: selectedCategorySlug || "all", sort: selectedSort, media: "all", range: selectedRange })}
                  className={`posts-filter-chip ${selectedMedia === "all" ? "active" : ""}`}
                >
                  All
                </Link>
                <Link
                  href={filterHref({ category: selectedCategorySlug || "all", sort: selectedSort, media: "image", range: selectedRange })}
                  className={`posts-filter-chip ${selectedMedia === "image" ? "active" : ""}`}
                >
                  With Image
                </Link>
              </div>
            </div>

            <div className="posts-filter-group">
              <p className="posts-filter-group-title">Time Range</p>
              <div className="posts-filter-chip-row">
                <Link
                  href={filterHref({ category: selectedCategorySlug || "all", sort: selectedSort, media: selectedMedia, range: "all" })}
                  className={`posts-filter-chip ${selectedRange === "all" ? "active" : ""}`}
                >
                  All
                </Link>
                <Link
                  href={filterHref({ category: selectedCategorySlug || "all", sort: selectedSort, media: selectedMedia, range: "7d" })}
                  className={`posts-filter-chip ${selectedRange === "7d" ? "active" : ""}`}
                >
                  7d
                </Link>
                <Link
                  href={filterHref({ category: selectedCategorySlug || "all", sort: selectedSort, media: selectedMedia, range: "30d" })}
                  className={`posts-filter-chip ${selectedRange === "30d" ? "active" : ""}`}
                >
                  30d
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <div className="posts-main">
          <header className="posts-head">
            <div>
              <p className="blog-sub">Editorial Feed</p>
              <h1 className="blog-title">All Posts</h1>
            </div>
          </header>

          {filteredPosts.length > 0 ? (
            <div className="blog-grid">
              {filteredPosts.map((post, index) => (
                <BlogCard
                  key={post.id}
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  coverImageUrl={post.cover_image_url}
                  categoryName={categoryMap.get(post.category_id)?.name}
                  published={post.published}
                  createdAt={post.created_at}
                  accentColor={index % 2 !== 0 ? "green" : "blue"}
                />
              ))}
            </div>
          ) : (
            <div className="admin-panel">
              <p className="empty-state-desc">No posts found in this category yet.</p>
            </div>
          )}
        </div>

        <aside className="posts-page-side">
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        </aside>
      </section>
    </>
  );
}
