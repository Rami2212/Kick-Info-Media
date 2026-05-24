import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Match | KickInfoMedia",
  description: "Watch the live football stream.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const streamUrl = "https://embedsports.me/la-liga/real-madrid-vs-athletic-club-stream-1";

export default function LivePage() {
  return (
    <main className="live-page">
      <section className="live-head">
        <p className="blog-sub">Live</p>
        <h1 className="blog-title">Live Match</h1>
      </section>

      <section className="live-embed-wrap">
        <div className="live-grid">
          {Array.from({ length: 9 }).map((_, index) => (
            <article key={`stream-${index + 1}`} className="live-grid-card">
              <p className="live-grid-label">Stream {index + 1}</p>
              <div className="live-embed-frame">
                <iframe
                  src={streamUrl}
                  width="100%"
                  height="100%"
                  scrolling="no"
                  frameBorder="0"
                  allowFullScreen
                  referrerPolicy="unsafe-url"
                  title={`Live stream ${index + 1}`}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
