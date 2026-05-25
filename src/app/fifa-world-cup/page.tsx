import type { Metadata } from "next";
import { AdSideRail, AutoStackedAdSideRail } from "@/app/components/ads/Ads";
import { getScheduleBracketSettings, getSiteSettings } from "@/lib/siteSettings";

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 | KickInfoMedia",
  description: "FIFA World Cup 2026 match schedule.",
};

type Fixture = {
  id: string;
  stage: string;
  date: string;
  time: string;
  slotA: number;
  slotB: number;
};

const FIXTURES: Fixture[] = [
  { id: "M74", stage: "Round of 32", date: "06/30/2026", time: "02:00", slotA: 1, slotB: 2 },
  { id: "M76", stage: "Round of 32", date: "06/29/2026", time: "22:30", slotA: 47, slotB: 48 },
  { id: "M77", stage: "Round of 32", date: "07/01/2026", time: "02:30", slotA: 3, slotB: 4 },
  { id: "M78", stage: "Round of 32", date: "06/30/2026", time: "22:30", slotA: 49, slotB: 50 },
  { id: "M73", stage: "Round of 32", date: "06/29/2026", time: "00:30", slotA: 5, slotB: 6 },
  { id: "M79", stage: "Round of 32", date: "07/01/2026", time: "06:30", slotA: 51, slotB: 52 },
  { id: "M75", stage: "Round of 32", date: "06/30/2026", time: "06:30", slotA: 7, slotB: 8 },
  { id: "M80", stage: "Round of 32", date: "07/01/2026", time: "21:30", slotA: 53, slotB: 54 },
  { id: "M83", stage: "Round of 32", date: "07/03/2026", time: "04:30", slotA: 9, slotB: 10 },
  { id: "M86", stage: "Round of 32", date: "07/04/2026", time: "03:30", slotA: 55, slotB: 56 },
  { id: "M84", stage: "Round of 32", date: "07/03/2026", time: "00:30", slotA: 11, slotB: 12 },
  { id: "M88", stage: "Round of 32", date: "07/03/2026", time: "23:30", slotA: 57, slotB: 58 },
  { id: "M81", stage: "Round of 32", date: "07/02/2026", time: "05:30", slotA: 13, slotB: 14 },
  { id: "M85", stage: "Round of 32", date: "07/03/2026", time: "08:30", slotA: 59, slotB: 60 },
  { id: "M82", stage: "Round of 32", date: "07/02/2026", time: "01:30", slotA: 15, slotB: 16 },
  { id: "M87", stage: "Round of 32", date: "07/04/2026", time: "07:00", slotA: 61, slotB: 62 },
  { id: "M89", stage: "Round of 16", date: "07/05/2026", time: "02:30", slotA: 17, slotB: 18 },
  { id: "M90", stage: "Round of 16", date: "07/04/2026", time: "22:30", slotA: 19, slotB: 20 },
  { id: "M93", stage: "Round of 16", date: "07/07/2026", time: "00:30", slotA: 21, slotB: 22 },
  { id: "M94", stage: "Round of 16", date: "07/07/2026", time: "05:30", slotA: 23, slotB: 24 },
  { id: "M91", stage: "Round of 16", date: "07/06/2026", time: "01:30", slotA: 39, slotB: 40 },
  { id: "M92", stage: "Round of 16", date: "07/06/2026", time: "05:30", slotA: 41, slotB: 42 },
  { id: "M95", stage: "Round of 16", date: "07/07/2026", time: "21:30", slotA: 43, slotB: 44 },
  { id: "M96", stage: "Round of 16", date: "07/08/2026", time: "01:30", slotA: 45, slotB: 46 },
  { id: "M97", stage: "Quarter-final", date: "07/10/2026", time: "01:30", slotA: 25, slotB: 26 },
  { id: "M98", stage: "Quarter-final", date: "07/11/2026", time: "00:30", slotA: 27, slotB: 28 },
  { id: "M99", stage: "Quarter-final", date: "07/12/2026", time: "02:30", slotA: 35, slotB: 36 },
  { id: "M100", stage: "Quarter-final", date: "07/12/2026", time: "06:30", slotA: 37, slotB: 38 },
  { id: "M101", stage: "Semi-final", date: "07/15/2026", time: "00:30", slotA: 29, slotB: 30 },
  { id: "M102", stage: "Semi-final", date: "07/16/2026", time: "00:30", slotA: 33, slotB: 34 },
  { id: "M103", stage: "Third-place Play-off", date: "07/19/2026", time: "02:30", slotA: 63, slotB: 64 },
  { id: "M104", stage: "Final", date: "07/20/2026", time: "00:30", slotA: 31, slotB: 32 },
];

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
  const bracket = getScheduleBracketSettings(settings);
  const slotMap = new Map(bracket.slots.map((slot) => [slot.id, slot]));

  const sortedFixtures = [...FIXTURES].sort(
    (a, b) => parseFixtureDateTime(a.date, a.time) - parseFixtureDateTime(b.date, b.time),
  );

  const grouped = new Map<string, Fixture[]>();
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
          <h1 className="blog-title">FIFA World Cup 2026</h1>
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
                    const teamA = slotMap.get(fixture.slotA);
                    const teamB = slotMap.get(fixture.slotB);
                    return (
                      <article key={fixture.id} className="fifa-schedule-card">
                        <div className="fifa-schedule-meta">
                          <span className={stageClassName(fixture.stage)}>{fixture.stage}</span>
                          <span className="fifa-schedule-id">{fixture.id}</span>
                        </div>

                        <div className="fifa-schedule-match-row">
                          <div className="fifa-schedule-team fifa-schedule-team-left">
                            {teamA?.flagImageUrl ? (
                              <img
                                src={teamA.flagImageUrl}
                                alt={`${teamA.name} flag`}
                                className="fifa-schedule-flag"
                              />
                            ) : (
                              <span className="fifa-schedule-flag fifa-schedule-flag-empty" aria-hidden="true" />
                            )}
                            <span className="fifa-schedule-name">{teamA?.name || teamA?.code || "TBD"}</span>
                          </div>

                          <div className="fifa-schedule-vs">vs</div>

                          <div className="fifa-schedule-kickoff" aria-label={`Kickoff at ${fixture.time} UTC`}>
                            <span className="fifa-schedule-time">{fixture.time}</span>
                            <small>UTC</small>
                          </div>

                          <div className="fifa-schedule-team fifa-schedule-team-right">
                            <span className="fifa-schedule-name">{teamB?.name || teamB?.code || "TBD"}</span>
                            {teamB?.flagImageUrl ? (
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
