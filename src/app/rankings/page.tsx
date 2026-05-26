import type { Metadata } from "next";
import Link from "next/link";
import RankingsTable from "@/app/components/RankingsTable";
import { getRankingsSettings, getSiteSettings } from "@/lib/siteSettings";
import { AdSideRail } from "@/app/components/ads/Ads";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FIFA Rankings | KickInfoMedia",
  description: "Men and Women FIFA rankings with country flags and points.",
  keywords: mergeSeoKeywords(
    ["fifa rankings", "world rankings", "men fifa ranking", "women fifa ranking"],
    SEO_DEFAULT_KEYWORDS,
  ),
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RankingsPage() {
  const settings = await getSiteSettings();
  const rankings = getRankingsSettings(settings);

  return (
    <main className="rankings-page rankings-shell">
      <aside className="rankings-page-side">
        <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
      </aside>

      <div className="rankings-main">
        <section className="rankings-page-head">
          <p className="blog-sub">FIFA</p>
          <h1 className="blog-title">World Rankings</h1>
          <p className="editor-desc">Official points snapshot for Men and Women.</p>
        </section>

        <section className="rankings-page-panel">
          <div className="rankings-grid rankings-grid-page">
            <RankingsTable title="Men" rows={rankings.men.slice(0, 10)} />
            <RankingsTable title="Women" rows={rankings.women.slice(0, 10)} />
          </div>
        </section>

        <section className="rankings-actions">
          <Link href="/" className="home-triple-link">Back To Home -&gt;</Link>
        </section>
      </div>

      <aside className="rankings-page-side">
        <AdSideRail size="160x300" smartLinkLabel="Partner" />
      </aside>
    </main>
  );
}
