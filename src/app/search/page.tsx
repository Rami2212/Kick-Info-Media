import type { Metadata } from "next";
import Link from "next/link";
import BlogCard from "@/app/components/BlogCard";
import { listBlogPosts } from "@/lib/blogPosts";
import { listCategories } from "@/lib/categories";
import { listTeams, teamCountryToSlug } from "@/lib/teams";
import { AdSideRail } from "@/app/components/ads/Ads";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Search | KickInfoMedia",
  description: "Search posts, teams, and categories.",
  keywords: mergeSeoKeywords(
    ["football search", "search teams", "search world cup posts"],
    SEO_DEFAULT_KEYWORDS,
  ),
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<{ q?: string }>;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function includesQuery(query: string, ...fields: string[]): boolean {
  const q = query.toLowerCase();
  return fields.some((field) => normalizeText(field).toLowerCase().includes(q));
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = normalizeText(q);
  const hasQuery = query.length > 0;

  const [categories, posts, teams] = await Promise.all([
    listCategories(),
    hasQuery ? listBlogPosts({ publishedOnly: true }) : Promise.resolve([]),
    hasQuery ? listTeams({ publishedOnly: true }) : Promise.resolve([]),
  ]);

  const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

  const postResults = hasQuery
    ? posts
        .filter((post) =>
          includesQuery(
            query,
            post.title,
            post.excerpt,
            stripHtml(post.content || ""),
            post.seo_description,
            post.seo_keywords,
            categoryMap.get(post.category_id)?.name || "",
          ),
        )
        .slice(0, 24)
    : [];

  const teamResults = hasQuery
    ? teams
        .filter((team) =>
          includesQuery(query, team.country, team.group, stripHtml(team.description || "")),
        )
        .slice(0, 24)
    : [];

  const categoryResults = hasQuery
    ? categories
        .filter((category) =>
          includesQuery(
            query,
            category.name,
            category.description,
            category.seo_description,
            category.seo_keywords,
          ),
        )
        .slice(0, 24)
    : [];

  const totalResults = postResults.length + teamResults.length + categoryResults.length;

  return (
    <>
      <div className="divider"></div>
      <main className="search-page">
        <aside className="search-page-side">
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        </aside>

        <section className="search-page-main">
          <header className="posts-head">
            <div>
              <p className="blog-sub">Search</p>
              <h1 className="blog-title">Site Search</h1>
            </div>
          </header>

          <form action="/search" method="get" className="search-form">
            <input
              type="text"
              name="q"
              defaultValue={query}
              className="search-input"
              placeholder="Search posts, teams, categories..."
            />
            <button type="submit" className="search-submit">Search</button>
          </form>

          {!hasQuery ? (
            <div className="admin-panel">
              <p className="empty-state-desc">Type a keyword to search the website.</p>
            </div>
          ) : (
            <>
              <p className="search-summary">
                {totalResults} result{totalResults === 1 ? "" : "s"} for "{query}"
              </p>

              <section className="search-section">
                <div className="section-head">
                  <span className="section-label">Posts</span>
                  <div className="section-line"></div>
                </div>
                {postResults.length > 0 ? (
                  <div className="blog-grid">
                    {postResults.map((post, index) => (
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
                    <p className="empty-state-desc">No post matches.</p>
                  </div>
                )}
              </section>

              <section className="search-section">
                <div className="section-head">
                  <span className="section-label">Teams</span>
                  <div className="section-line"></div>
                </div>
                {teamResults.length > 0 ? (
                  <div className="search-team-grid">
                    {teamResults.map((team) => (
                      <Link key={team.id} href={`/teams/${teamCountryToSlug(team.country)}`} className="team-card-link">
                        <article className="team-card">
                          <div className="team-card-body">
                            <h2 className="team-card-name">{team.country}</h2>
                            <p className="search-team-group">{team.group}</p>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="admin-panel">
                    <p className="empty-state-desc">No team matches.</p>
                  </div>
                )}
              </section>

              <section className="search-section">
                <div className="section-head">
                  <span className="section-label">Categories</span>
                  <div className="section-line"></div>
                </div>
                {categoryResults.length > 0 ? (
                  <div className="search-category-list">
                    {categoryResults.map((category) => (
                      <Link key={category.id} href={`/category/${category.slug}`} className="search-category-link">
                        <span className="search-category-name">{category.name}</span>
                        <span className="search-category-arrow">-&gt;</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="admin-panel">
                    <p className="empty-state-desc">No category matches.</p>
                  </div>
                )}
              </section>
            </>
          )}
        </section>

        <aside className="search-page-side">
          <AdSideRail size="160x300" smartLinkLabel="Partner" />
        </aside>
      </main>
    </>
  );
}
