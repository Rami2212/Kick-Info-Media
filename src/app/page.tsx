import type { Metadata } from "next";
import Link from "next/link";
import { listBlogPosts } from "@/lib/blogPosts";
import { listCategories } from "@/lib/categories";
import { fetchFootballData } from "@/lib/footballDataApi";
import {
  getHomePostSelections,
  getNextMatchSettings,
  getRankingsSettings,
  getSiteSettings,
} from "@/lib/siteSettings";
import { auth } from "@/lib/googleAuth";
import HeroSection from "./components/HeroSection";
import BlogCard from "./components/BlogCard";
import SidebarBlock from "./components/SidebarBlock";
import WorldCupBracketGame from "./components/WorldCupBracketGame";
import RankingsTable from "./components/RankingsTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "KickInfoMedia - Breaking Football News, Transfers & Analysis",
  description: "The premier destination for breaking football news, tactical analysis, and live coverage from across the globe.",
};

type FootballMatch = {
  id?: number;
  utcDate?: string;
  status?: string;
  competition?: { name?: string; code?: string };
  homeTeam?: { name?: string };
  awayTeam?: { name?: string };
};

type FootballMatchesPayload = {
  matches?: FootballMatch[];
};

function getNextScheduledMatch(payload: unknown): FootballMatch | null {
  if (!payload || typeof payload !== "object") return null;
  const maybeMatches = (payload as FootballMatchesPayload).matches;
  if (!Array.isArray(maybeMatches) || maybeMatches.length === 0) return null;

  const withDates = maybeMatches.filter((match) => typeof match?.utcDate === "string");
  if (withDates.length === 0) return maybeMatches[0] || null;

  return [...withDates].sort((a, b) => {
    const aTime = new Date(a.utcDate || "").getTime();
    const bTime = new Date(b.utcDate || "").getTime();
    return aTime - bTime;
  })[0] || null;
}

function formatMatchDate(value?: string) {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Home() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;

  const posts = await listBlogPosts({ publishedOnly: true });
  const categories = await listCategories();
  const settings = await getSiteSettings();
  const homeSelections = getHomePostSelections(settings);
  const nextMatch = getNextMatchSettings(settings);
  const rankings = getRankingsSettings(settings);
  let nextLiveMatch: FootballMatch | null = null;

  try {
    const football = await fetchFootballData({
      path: "/matches",
      params: { status: "SCHEDULED" },
      cacheTtlMs: 120_000,
    });
    nextLiveMatch = getNextScheduledMatch(football.payload);
  } catch {
    nextLiveMatch = null;
  }

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

  const matchCompetition = nextLiveMatch?.competition?.name || nextLiveMatch?.competition?.code || "Unknown Competition";
  const matchCompetitionCode = nextLiveMatch?.competition?.code || "N/A";
  const matchIdLabel = typeof nextLiveMatch?.id === "number" ? String(nextLiveMatch.id) : "TBD";
  const matchHome = nextLiveMatch?.homeTeam?.name || "Home Team";
  const matchAway = nextLiveMatch?.awayTeam?.name || "Away Team";
  const matchStatus = nextLiveMatch?.status || "SCHEDULED";
  const matchKickoff = formatMatchDate(nextLiveMatch?.utcDate);

  return (
    <main>
      <HeroSection posts={heroPostsData} />
      {/* <CategoryGrid categories={categoryGridData} /> */}

      <section className="home-triple-row">
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
        </article>

        <article className="home-triple-card">
          <p className="home-triple-kicker">Next Match Stat</p>
          <h3 className="home-triple-title">{matchHome} vs {matchAway}</h3>
          <p className="home-triple-desc">{matchCompetition}</p>
          <div className="home-triple-stats">
            <p className="home-triple-meta"><span>Match ID</span><strong>{matchIdLabel}</strong></p>
            <p className="home-triple-meta"><span>Code</span><strong>{matchCompetitionCode}</strong></p>
            <p className="home-triple-meta"><span>Kickoff</span><strong>{matchKickoff}</strong></p>
            <p className="home-triple-meta"><span>Status</span><strong>{matchStatus}</strong></p>
          </div>
          <Link href="/football" className="home-triple-link">
            View Match Stats -&gt;
          </Link>
        </article>

        <div className="home-triple-split">
          <Link href="/live" className="home-triple-split-live">
            <p className="home-triple-kicker">Watch Live</p>
            <h3 className="home-triple-title">Live Match Stream</h3>
            <p className="home-triple-desc">Jump into the live feed and watch the action in real time.</p>
            <div className="home-triple-live-row">
              <span className="home-triple-live-dot"></span>
              <span className="home-triple-live-text">Live Now</span>
              <span className="home-triple-live-arrow">-&gt;</span>
            </div>
          </Link>
          <div className="home-triple-split-blank" />
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
