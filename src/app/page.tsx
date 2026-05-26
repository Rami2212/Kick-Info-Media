import type { Metadata } from "next";
import Link from "next/link";
import { listBlogPosts } from "@/lib/blogPosts";
import { listCategories } from "@/lib/categories";
import { getNextFifa2026MatchFromApiSports } from "@/lib/apiSportsFootball";
import {
  getHomePostSelections,
  getNextMatchSettings,
  getRankingsSettings,
  getScheduleGroupStageSettings,
  getSiteSettings,
} from "@/lib/siteSettings";
import { auth } from "@/lib/googleAuth";
import HeroSection from "./components/HeroSection";
import BlogCard from "./components/BlogCard";
import SidebarBlock from "./components/SidebarBlock";
import WorldCupBracketGame from "./components/WorldCupBracketGame";
import RankingsTable from "./components/RankingsTable";
import HomeGroupAQuickPick from "./components/HomeGroupAQuickPick";
import { CompactAdSlot } from "./components/ads/Ads";
import ResponsiveAdSlotsBar from "./components/ads/ResponsiveAdSlotsBar";
import { SEO_DEFAULT_DESCRIPTION, SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "KickInfoMedia - Breaking Football News, Transfers & Analysis",
  description: SEO_DEFAULT_DESCRIPTION,
  keywords: mergeSeoKeywords(
    ["football homepage", "latest football updates", "FIFA news", "world cup news"],
    SEO_DEFAULT_KEYWORDS,
  ),
};

export default async function Home() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;

  const posts = await listBlogPosts({ publishedOnly: true });
  const categories = await listCategories();
  const settings = await getSiteSettings();
  const homeSelections = getHomePostSelections(settings);
  const nextMatch = getNextMatchSettings(settings);
  const rankings = getRankingsSettings(settings);
  const groupStage = getScheduleGroupStageSettings(settings);
  const groupA =
    groupStage.groups.find((group) => group.id.trim().toUpperCase() === "A") || groupStage.groups[0] || null;
  const apiSportsResult = await getNextFifa2026MatchFromApiSports()
    .then((match) => ({ match, error: "" }))
    .catch((error: unknown) => ({
      match: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }));
  const apiSportsNextMatch = apiSportsResult.match;
  const apiSportsError = apiSportsResult.error;
  const nextMatchCard = apiSportsNextMatch || {
    title: "FIFA 2026 - Next Match",
    subtitle: apiSportsError ? `Live API data unavailable (${apiSportsError})` : "Live API data unavailable",
    home: {
      name: "Home",
      flagImageUrl: "",
      goals: "-",
    },
    away: {
      name: "Away",
      flagImageUrl: "",
      goals: "-",
    },
    kickoff: "TBD",
    status: "Unavailable",
    venue: "TBD",
    stats: [
      { label: "Shots on Goal", home: "-", away: "-" },
      { label: "Total Shots", home: "-", away: "-" },
      { label: "Ball Possession", home: "-", away: "-" },
      { label: "Passes %", home: "-", away: "-" },
      { label: "Corner Kicks", home: "-", away: "-" },
      { label: "Fouls", home: "-", away: "-" },
    ],
  };

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat.name);
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

  return (
    <main>
      <HeroSection posts={heroPostsData} />
      {/* <CategoryGrid categories={categoryGridData} /> */}

      <section className="home-pre-game-row">
        <div className="home-triple-split">
          <Link href="/live" className="home-triple-split-live">
            <p className="home-triple-kicker">Watch Live</p>
            <h3 className="home-triple-title">Live Match Stats</h3>
            <p className="home-triple-desc">Open the live match center for score, stats, and lineup updates.</p>
            <div className="home-triple-live-row">
              <span className="home-triple-live-dot"></span>
              <span className="home-triple-live-text">Live Now</span>
              <span className="home-triple-live-arrow">-&gt;</span>
            </div>
          </Link>
          <div className="home-triple-split-blank ad-compact-slot">
            <CompactAdSlot size="300x250" />
          </div>
        </div>

        <HomeGroupAQuickPick group={groupA} />

        <article className="home-triple-card">
          <p className="home-triple-kicker">Fan Poll</p>
          <h3 className="home-triple-title">
            {nextMatch.teamA.name || "Team A"} vs {nextMatch.teamB.name || "Team B"}
          </h3>
          <p className="home-triple-desc">
            {loggedIn
              ? "Vote for the winner and see live percentages."
              : "Login to vote in the live country poll."}
          </p>
          <WorldCupBracketGame
            matchId={nextMatch.matchId}
            teamA={nextMatch.teamA}
            teamB={nextMatch.teamB}
            initialVotes={{ [nextMatch.matchId]: nextMatch.votes }}
            requireAuth
            isLoggedIn={loggedIn}
            compact
          />
          <div className="ad-compact-slot" style={{ marginTop: "14px" }}>
            <CompactAdSlot size="460x100" />
          </div>
        </article>
      </section>

      <ResponsiveAdSlotsBar
        maxSlots={4}
        adKeys={[
          "73b06254b42b30e1dada76bc6e9ae0ec",
          "73b06254b42b30e1dada76bc6e9ae0ec",
          "73b06254b42b30e1dada76bc6e9ae0ec",
          "73b06254b42b30e1dada76bc6e9ae0ec",
        ]}
      />

      <section className="home-triple-row">
        <article className="home-triple-card home-next-combined-card">
          <p className="home-triple-kicker">{nextMatchCard.title}</p>
          <h3 className="home-triple-title">
            {nextMatchCard.home.name} vs {nextMatchCard.away.name}
          </h3>
          <p className="home-triple-desc">{nextMatchCard.subtitle}</p>

          <div className="home-next-scoreline">
            <div className="home-next-team">
              {nextMatchCard.home.flagImageUrl ? (
                <img
                  src={nextMatchCard.home.flagImageUrl}
                  alt={`${nextMatchCard.home.name} flag`}
                  className="home-next-flag"
                />
              ) : null}
              <span>{nextMatchCard.home.name}</span>
            </div>
            <div className="home-next-score">
              <strong>{nextMatchCard.home.goals}</strong>
              <span>-</span>
              <strong>{nextMatchCard.away.goals}</strong>
            </div>
            <div className="home-next-team home-next-team-away">
              {nextMatchCard.away.flagImageUrl ? (
                <img
                  src={nextMatchCard.away.flagImageUrl}
                  alt={`${nextMatchCard.away.name} flag`}
                  className="home-next-flag"
                />
              ) : null}
              <span>{nextMatchCard.away.name}</span>
            </div>
          </div>

          <div className="home-triple-stats">
            <p className="home-triple-meta"><span>Kickoff</span><strong>{nextMatchCard.kickoff || "TBD"}</strong></p>
            <p className="home-triple-meta"><span>Status</span><strong>{nextMatchCard.status || "TBD"}</strong></p>
            <p className="home-triple-meta"><span>Venue</span><strong>{nextMatchCard.venue || "TBD"}</strong></p>
          </div>

          <div className="home-next-stat-table">
            {nextMatchCard.stats.map((row, index) => (
              <div key={`${row.label}-${index}`} className="home-next-stat-row">
                <strong>{row.home || "-"}</strong>
                <span>{row.label}</span>
                <strong>{row.away || "-"}</strong>
              </div>
            ))}
          </div>
        </article>

        <div className="home-triple-split">
          <Link href="/fifa-world-cup" className="home-triple-split-live">
            <p className="home-triple-kicker">Schedule</p>
            <h3 className="home-triple-title">FIFA World Cup Schedule</h3>
            <p className="home-triple-desc">Open the fixture list with kickoff times, countries, and match stages.</p>
            <div className="home-triple-live-row">
              <span className="home-triple-live-dot home-triple-live-dot-schedule"></span>
              <span className="home-triple-live-text">View Schedule</span>
              <span className="home-triple-live-arrow">-&gt;</span>
            </div>
          </Link>
          <div className="home-triple-split-blank ad-compact-slot">
            <CompactAdSlot size="468x60" />
            <CompactAdSlot size="468x60" />
          </div>
        </div>
      </section>

      <section className="lower">
        <div className="editor-block">
          <div className="section-head" style={{ marginBottom: "8px" }}>
            <span className="section-label">FIFA Rankings</span>
            <div className="section-line"></div>
          </div>
          <h3 className="editor-title">World Rankings Snapshot</h3>
          <p className="editor-desc">Men and Women top rankings with official points.</p>
          <div className="rankings-grid">
            <RankingsTable title="Men" rows={rankings.men.slice(0, 10)} />
            <RankingsTable title="Women" rows={rankings.women.slice(0, 10)} />
          </div>
          <div className="rankings-actions">
            <Link href="/rankings" className="home-triple-link">
              Open Rankings Page -&gt;
            </Link>
          </div>
          <SidebarBlock className="home-mobile-trending" trendingPosts={trendingPosts} />
        </div>

        <aside className="sidebar">
          <SidebarBlock trendingPosts={trendingPosts} />
        </aside>
      </section>

      <ResponsiveAdSlotsBar
          maxSlots={4}
          adKeys={[
            "73b06254b42b30e1dada76bc6e9ae0ec",
            "73b06254b42b30e1dada76bc6e9ae0ec",
            "73b06254b42b30e1dada76bc6e9ae0ec",
            "73b06254b42b30e1dada76bc6e9ae0ec",
          ]}
      />

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
