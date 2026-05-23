import Link from "next/link";

type HeroSectionProps = {
  posts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    coverImageUrl?: string;
    categoryName?: string;
    createdAt: string;
  }>;
};

export default function HeroSection({ posts }: HeroSectionProps) {
  if (!posts || posts.length === 0) {
    return (
      <section className="hero">
        <div className="empty-state">
          <h2 className="empty-state-title">No stories yet</h2>
          <p className="empty-state-desc">Check back later for top stories.</p>
        </div>
      </section>
    );
  }

  const mainPost = posts[0];
  const sidePosts = posts.slice(1, 4);
  
  const mainDate = new Date(mainPost.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <section className="hero">
      <div className="section-head">
        <span className="section-label">Today&apos;s Top Stories</span>
        <div className="section-line"></div>
        <Link href="#" className="section-all">All Stories →</Link>
      </div>

      <div className="hero-grid">
        <Link href={`/posts/${mainPost.slug}`} className="hero-main">
          <div
            className="hero-bg"
            style={
              mainPost.coverImageUrl
                ? {
                    backgroundImage: `linear-gradient(135deg, rgba(8, 20, 36, 0.68), rgba(5, 5, 5, 0.72)), url(${mainPost.coverImageUrl})`,
                  }
                : undefined
            }
          ></div>
          <div className="hero-pitch"></div>
          <div className="hero-circle"></div>
          <div className="hero-num">01</div>
          <div className="hero-accent"></div>
          <div className="hero-content">
            <div className="hero-badges">
              {mainPost.categoryName && <span className="badge badge-blue">{mainPost.categoryName}</span>}
            </div>
            <h1 className="hero-title">{mainPost.title}</h1>
            <p className="hero-excerpt">{mainPost.excerpt}</p>
            <div className="hero-meta">
              <span className="hero-meta-author">Editorial Team</span>
              <span>·</span>
              <span>{mainDate}</span>
              <span>·</span>
              <span>6 min read</span>
            </div>
          </div>
        </Link>

        {sidePosts.length > 0 && (
          <div className="hero-side">
            {sidePosts.map((post, index) => {
              const dateStr = new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <Link key={post.slug} href={`/posts/${post.slug}`} className="side-card">
                  <div
                    className="side-bg"
                    style={
                      post.coverImageUrl
                        ? {
                            backgroundImage: `linear-gradient(140deg, rgba(8, 16, 26, 0.66), rgba(10, 10, 10, 0.76)), url(${post.coverImageUrl})`,
                          }
                        : undefined
                    }
                  ></div>
                  <div className="side-overlay"></div>
                  <div className="side-num">0{index + 2}</div>
                  <div className="side-accent"></div>
                  <div className="side-content">
                    <p className="side-title">{post.title}</p>
                    <span className="side-date">{dateStr}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
