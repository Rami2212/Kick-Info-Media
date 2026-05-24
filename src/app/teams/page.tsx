import { listBlogPosts } from "@/lib/blogPosts";
import { listCategories } from "@/lib/categories";
import BlogCard from "../components/BlogCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeamsPage() {
  const [categories, allPosts] = await Promise.all([
    listCategories(),
    listBlogPosts({ publishedOnly: true }),
  ]);

  const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));
  const teamsCategory =
    categories.find((cat) => cat.slug.trim().toLowerCase() === "teams") ||
    categories.find((cat) => cat.name.trim().toLowerCase() === "teams") ||
    null;

  const teamPosts = teamsCategory
    ? allPosts.filter((post) => post.category_id === teamsCategory.id)
    : [];

  return (
    <>
      <div className="divider"></div>
      <section className="posts-page">
        <aside className="posts-filter-sidebar">
          <div className="posts-filter-box posts-filter-box-blank" aria-hidden="true"></div>
        </aside>

        <div className="posts-main">
          <header className="posts-head">
            <div>
              <p className="blog-sub">Editorial Feed</p>
              <h1 className="blog-title">Teams</h1>
            </div>
          </header>

          {teamPosts.length > 0 ? (
            <div className="blog-grid">
              {teamPosts.map((post, index) => (
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
              <p className="empty-state-desc">
                {teamsCategory ? "No team posts found yet." : "Teams category not found yet."}
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
