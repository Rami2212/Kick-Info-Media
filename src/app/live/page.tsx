import type { Metadata } from "next";
import { getLiveStreamSettings, getSiteSettings } from "@/lib/siteSettings";
import { AdSideRail } from "@/app/components/ads/Ads";

export const metadata: Metadata = {
  title: "Live Match | KickInfoMedia",
  description: "Watch the live football stream.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LivePage() {
  const settings = await getSiteSettings();
  const liveStream = getLiveStreamSettings(settings);

  return (
    <main className="live-page live-shell">
      <aside className="live-page-side">
        <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
      </aside>

      <div className="live-main">
        <section className="live-head">
          <p className="blog-sub">Live</p>
          <h1 className="blog-title">Live Match</h1>
        </section>

        <section className="live-embed-wrap">
          <article className="live-grid-card">
            <p className="live-grid-label">Live Stream 1</p>
            <div className="live-embed-frame">
              <iframe
                src={liveStream.primaryStreamUrl}
                width="100%"
                height="100%"
                scrolling="no"
                frameBorder="0"
                allowFullScreen
                referrerPolicy="unsafe-url"
                title="Live stream 1"
              />
            </div>
          </article>

          <article className="live-grid-card">
            <p className="live-grid-label">Live Stream 2</p>
            <div className="live-embed-frame">
              <iframe
                src={liveStream.secondaryStreamUrl}
                width="100%"
                height="100%"
                scrolling="no"
                frameBorder="0"
                allowFullScreen
                referrerPolicy="unsafe-url"
                title="Live stream 2"
              />
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
