import { listBlogPosts } from "@/lib/blogPosts";
import Link from "next/link";

export default async function Ticker() {
  const posts = await listBlogPosts({ publishedOnly: true, limit: 8 });
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', ' ·');

  return (
    <div className="ticker-wrap">
      <div className="ticker-label">Breaking</div>
      <div className="ticker-scroll">
        <div className="ticker-inner">
          {posts.map((post) => (
            <span key={`ticker-1-${post.id}`}>
              <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              <span className="ticker-sep">◆</span>
            </span>
          ))}
          {/* Duplicate for seamless scrolling */}
          {posts.map((post) => (
            <span key={`ticker-2-${post.id}`}>
              <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              <span className="ticker-sep">◆</span>
            </span>
          ))}
        </div>
      </div>
      <div className="ticker-date">{dateStr}</div>
    </div>
  );
}
