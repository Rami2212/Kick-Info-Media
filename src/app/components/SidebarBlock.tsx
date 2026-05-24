import Link from "next/link";

type SidebarBlockProps = {
  trendingPosts: Array<{
    slug: string;
    title: string;
    categoryName?: string;
  }>;
};

export default function SidebarBlock({ trendingPosts }: SidebarBlockProps) {
  return (
    <>
      {/* Trending */}
      {trendingPosts && trendingPosts.length > 0 && (
        <div className="sidebar-block">
          <div className="sidebar-header">
            <span className="sidebar-title">Trending Now</span>
            <div className="pulse"></div>
          </div>
          {trendingPosts.map((post, index) => (
            <Link key={post.slug} href={`/posts/${post.slug}`} className="trending-item">
              <span className="trending-num">{index + 1}</span>
              <div>
                <p className="trending-title">{post.title}</p>
                {post.categoryName && <p className="trending-cat">{post.categoryName}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Newsletter */}
      <div className="newsletter">
        <div className="newsletter-watermark">KIM</div>
        <p className="newsletter-label">Free Newsletter</p>
        <h3 className="newsletter-title">The Daily Pulse — 5 min reads, zero fluff</h3>
        <p className="newsletter-sub">25,000+ readers get our best stories every morning.</p>
        <input className="nl-input" type="email" placeholder="Your email address" />
        <button className="nl-btn">Subscribe Free</button>
      </div>

      {/* Poll */}
      {/*<div className="sidebar-block">*/}
      {/*  <div className="sidebar-header"><span className="sidebar-title">Fan Poll</span></div>*/}
      {/*  <div className="poll-inner">*/}
      {/*    <p className="poll-q">Who wins the 2026 Champions League?</p>*/}
      {/*    <div className="poll-opt">*/}
      {/*      <div className="poll-bar" style={{ width: '38%' }}></div>*/}
      {/*      <div className="poll-opt-inner">*/}
      {/*        <span className="poll-label">Real Madrid</span>*/}
      {/*        <span className="poll-pct">38%</span>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*    <div className="poll-opt">*/}
      {/*      <div className="poll-bar" style={{ width: '27%' }}></div>*/}
      {/*      <div className="poll-opt-inner">*/}
      {/*        <span className="poll-label">Man City</span>*/}
      {/*        <span className="poll-pct">27%</span>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*    <div className="poll-opt">*/}
      {/*      <div className="poll-bar" style={{ width: '19%' }}></div>*/}
      {/*      <div className="poll-opt-inner">*/}
      {/*        <span className="poll-label">Bayern Munich</span>*/}
      {/*        <span className="poll-pct">19%</span>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*    <div className="poll-opt">*/}
      {/*      <div className="poll-bar" style={{ width: '16%' }}></div>*/}
      {/*      <div className="poll-opt-inner">*/}
      {/*        <span className="poll-label">Arsenal</span>*/}
      {/*        <span className="poll-pct">16%</span>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*    <p className="poll-total">12,483 votes · Results update live</p>*/}
      {/*  </div>*/}
      {/*</div>*/}
    </>
  );
}
