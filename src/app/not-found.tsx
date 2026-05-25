import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-shell">
      <section className="not-found-card">
        <p className="not-found-kicker">Kick Info Media</p>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-copy">
          The link you followed does not exist or has moved. Try the homepage or browse the latest news.
        </p>
        <div className="not-found-actions">
          <Link href="/" className="not-found-btn not-found-btn-primary">
            Back to home
          </Link>
          <Link href="/posts" className="not-found-btn not-found-btn-ghost">
            Browse news
          </Link>
        </div>
      </section>
    </main>
  );
}

