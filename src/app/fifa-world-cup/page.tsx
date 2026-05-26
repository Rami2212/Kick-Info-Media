import type { Metadata } from "next";
import { AdSideRail, AutoStackedAdSideRail } from "@/app/components/ads/Ads";
import {
  getFifaScheduleSettings,
  getSiteSettings,
} from "@/lib/siteSettings";
import type { FifaScheduleFixture } from "@/lib/fifaSchedule";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 | KickInfoMedia",
  description: "FIFA World Cup 2026 match schedule.",
  keywords: mergeSeoKeywords(
    ["fifa world cup 2026 schedule", "world cup fixtures", "world cup kickoff times"],
    SEO_DEFAULT_KEYWORDS,
  ),
};

function parseFixtureDateTime(dateText: string, timeText: string): number {
  const [month, day, year] = dateText.split("/").map((value) => Number(value));
  const [hour, minute] = timeText.split(":").map((value) => Number(value));
  if (!month || !day || !year) return Number.MAX_SAFE_INTEGER;
  return Date.UTC(year, month - 1, day, hour || 0, minute || 0);
}

function formatDayHeading(dateText: string): string {
  const [month, day, year] = dateText.split("/").map((value) => Number(value));
  if (!month || !day || !year) return dateText;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function stageClassName(stage: string): string {
  const slug = stage
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `fifa-schedule-stage-badge fifa-schedule-stage-${slug}`;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FifaWorldCupPage() {
  const settings = await getSiteSettings();
  const schedule = getFifaScheduleSettings(settings);

  const sortedFixtures = [...schedule.fixtures].sort(
    (a, b) => parseFixtureDateTime(a.date, a.time) - parseFixtureDateTime(b.date, b.time),
  );

  const grouped = new Map<string, FifaScheduleFixture[]>();
  for (const fixture of sortedFixtures) {
    if (!grouped.has(fixture.date)) grouped.set(fixture.date, []);
    grouped.get(fixture.date)?.push(fixture);
  }

  return (
    <main className="football-page wc-dark fifa-world-page">
      <aside className="fifa-world-side fifa-world-side-left">
        <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
      </aside>

      <div className="fifa-world-main">
        <section className="football-head">
          <p className="blog-sub">FIFA World Cup</p>
          <h1 className="blog-title">World Cup 2026 Schedule</h1>
          <p className="football-subtitle">11 June - 19 July 2026</p>
        </section>

        <section className="football-results fifa-schedule-wrap" style={{ marginTop: 20 }}>
          <div className="fifa-schedule-top">
            <h2 className="football-section-title">Schedule</h2>
            <span className="fifa-schedule-tz">All kickoff times UTC</span>
          </div>

          <div className="fifa-schedule-days">
            {Array.from(grouped.entries()).map(([dateKey, fixtures]) => (
              <section key={dateKey} className="fifa-schedule-day">
                <header className="fifa-schedule-day-head">
                  <h3 className="fifa-schedule-day-title">{formatDayHeading(dateKey)}</h3>
                  <span className="fifa-schedule-day-count">
                    {fixtures.length} match{fixtures.length > 1 ? "es" : ""}
                  </span>
                </header>

                <div className="fifa-schedule-list">
                  {fixtures.map((fixture) => {
                    const teamA = {
                      name: fixture.teamA?.name || "TBD",
                      flagImageUrl: fixture.teamA?.flagImageUrl || "",
                    };
                    const teamB = {
                      name: fixture.teamB?.name || "TBD",
                      flagImageUrl: fixture.teamB?.flagImageUrl || "",
                    };
                    return (
                      <article key={fixture.id} className="fifa-schedule-card">
                        <div className="fifa-schedule-meta">
                          <span className={stageClassName(fixture.stage)}>{fixture.stage}</span>
                          <span className="fifa-schedule-id">{fixture.id}</span>
                        </div>

                        <div className="fifa-schedule-match-row">
                          <div className="fifa-schedule-team fifa-schedule-team-left">
                            {teamA.flagImageUrl ? (
                              <img
                                src={teamA.flagImageUrl}
                                alt={`${teamA.name} flag`}
                                className="fifa-schedule-flag"
                              />
                            ) : (
                              <span className="fifa-schedule-flag fifa-schedule-flag-empty" aria-hidden="true" />
                            )}
                            <span className="fifa-schedule-name">{teamA.name}</span>
                          </div>

                          <div className="fifa-schedule-vs">vs</div>

                          <div className="fifa-schedule-kickoff" aria-label={`Kickoff at ${fixture.time} UTC`}>
                            <span className="fifa-schedule-time">{fixture.time}</span>
                            <small>UTC</small>
                          </div>

                          <div className="fifa-schedule-team fifa-schedule-team-right">
                            <span className="fifa-schedule-name">{teamB.name}</span>
                            {teamB.flagImageUrl ? (
                              <img
                                src={teamB.flagImageUrl}
                                alt={`${teamB.name} flag`}
                                className="fifa-schedule-flag"
                              />
                            ) : (
                              <span className="fifa-schedule-flag fifa-schedule-flag-empty" aria-hidden="true" />
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>

      <aside className="fifa-world-side fifa-world-side-right">
        <AutoStackedAdSideRail
          size="160x300"
          smartLinkLabel="Partner"
          targetSelector=".fifa-world-main"
          minSlots={1}
          maxSlots={10}
        />
        <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
      </aside>
    </main>
  );
}
