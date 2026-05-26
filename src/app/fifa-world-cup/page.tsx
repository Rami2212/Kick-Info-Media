import type { Metadata } from "next";
import { AdSideRail, AutoStackedAdSideRail } from "@/app/components/ads/Ads";
import FifaScheduleClient from "@/app/fifa-world-cup/FifaScheduleClient";
import {
  getFifaScheduleSettings,
  getSiteSettings,
} from "@/lib/siteSettings";
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FifaWorldCupPage() {
  const settings = await getSiteSettings();
  const schedule = getFifaScheduleSettings(settings);

  const sortedFixtures = [...schedule.fixtures].sort(
    (a, b) => parseFixtureDateTime(a.date, a.time) - parseFixtureDateTime(b.date, b.time),
  );

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
          <FifaScheduleClient fixtures={sortedFixtures} />
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
