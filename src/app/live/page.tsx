import type { Metadata } from "next";
import { getLiveMatchSettings, getSiteSettings } from "@/lib/siteSettings";
import { AdSideRail } from "@/app/components/ads/Ads";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Live Match Stats | KickInfoMedia",
  description: "Live football match stats and lineup.",
  keywords: mergeSeoKeywords(
    ["live match stats", "live lineup", "live football score", "match center"],
    SEO_DEFAULT_KEYWORDS,
  ),
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LivePage() {
  const settings = await getSiteSettings();
  const liveMatch = getLiveMatchSettings(settings);

  return (
    <main className="live-page live-shell">
      <aside className="live-page-side">
        <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
      </aside>

      <div className="live-main">
        <section className="live-head">
          <p className="blog-sub">Live</p>
          <h1 className="blog-title">Live Match Stats</h1>
        </section>

        <section className="live-match-wrap">
          <article className="live-match-card live-score-card">
            <div className="live-match-card-top">
              <div>
                <p className="live-grid-label">{liveMatch.subtitle}</p>
                <h2 className="live-match-title">{liveMatch.title}</h2>
              </div>
              <span className="live-status-pill">{liveMatch.status}</span>
            </div>

            <div className="live-scoreline">
              <div className="live-score-team">
                {liveMatch.teamA.flagImageUrl ? (
                  <img src={liveMatch.teamA.flagImageUrl} alt={`${liveMatch.teamA.name} flag`} className="live-team-flag" />
                ) : (
                  <span className="live-team-flag live-team-flag-empty" aria-hidden="true" />
                )}
                <strong>{liveMatch.teamA.name}</strong>
              </div>
              <div className="live-score-box">
                <span>{liveMatch.teamA.score}</span>
                <small>:</small>
                <span>{liveMatch.teamB.score}</span>
              </div>
              <div className="live-score-team live-score-team-away">
                <strong>{liveMatch.teamB.name}</strong>
                {liveMatch.teamB.flagImageUrl ? (
                  <img src={liveMatch.teamB.flagImageUrl} alt={`${liveMatch.teamB.name} flag`} className="live-team-flag" />
                ) : (
                  <span className="live-team-flag live-team-flag-empty" aria-hidden="true" />
                )}
              </div>
            </div>

            <div className="live-match-meta-grid">
              <p><span>Kickoff</span><strong>{liveMatch.kickoff}</strong></p>
              <p><span>Venue</span><strong>{liveMatch.venue}</strong></p>
            </div>
          </article>

          <article className="live-match-card">
            <p className="live-grid-label">Live Match Stats</p>
            <div className="live-stat-table">
              {liveMatch.stats.map((row, index) => (
                <div key={`${row.label}-${index}`} className="live-stat-row">
                  <strong>{row.teamA}</strong>
                  <span>{row.label}</span>
                  <strong>{row.teamB}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="live-match-card">
            <p className="live-grid-label">Full Lineup (Starting XI)</p>
            <div className="live-lineup-grid">
              <div>
                <h3 className="live-lineup-title">{liveMatch.teamA.name}</h3>
                <div className="live-lineup-list">
                  {liveMatch.lineups.teamA.map((player, index) => (
                    <p key={`${player.name}-${index}`} className="live-lineup-row">
                      <span>{player.position}</span>
                      <strong>{player.name}</strong>
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="live-lineup-title live-lineup-title-away">{liveMatch.teamB.name}</h3>
                <div className="live-lineup-list">
                  {liveMatch.lineups.teamB.map((player, index) => (
                    <p key={`${player.name}-${index}`} className="live-lineup-row">
                      <span>{player.position}</span>
                      <strong>{player.name}</strong>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>

      <aside className="live-page-side">
        <AdSideRail size="160x300" smartLinkLabel="Partner" />
        <AdSideRail size="160x300" smartLinkLabel="Partner" />
        <AdSideRail size="160x300" smartLinkLabel="Partner" />
      </aside>
    </main>
  );
}
