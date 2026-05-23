import { listBlogPosts } from "@/lib/blogPosts";
import { getSiteSettings } from "@/lib/siteSettings";
import Link from "next/link";

function getTopBarItems(extra: Record<string, unknown>): string[] {
  const value = extra.topBarItems;
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export default async function Ticker() {
  const [posts, settings] = await Promise.all([
    listBlogPosts({ publishedOnly: true, limit: 8 }),
    getSiteSettings(),
  ]);

  const topBarText =
    typeof settings.extra.topBarText === "string" && settings.extra.topBarText.trim()
      ? settings.extra.topBarText.trim()
      : "Breaking";
  const topBarItems = getTopBarItems(settings.extra);
  const dateStr = new Date()
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .replace(",", " |");
  const hasCustomItems = topBarItems.length > 0;

  return (
    <div className="ticker-wrap">
      <div className="ticker-label">{topBarText}</div>
      <div className="ticker-scroll">
        <div className="ticker-inner">
          {hasCustomItems
            ? topBarItems.map((item, index) => (
                <span key={`ticker-custom-1-${index}`}>
                  <span className="ticker-item-text">{item}</span>
                  <span className="ticker-sep">*</span>
                </span>
              ))
            : posts.map((post) => (
                <span key={`ticker-post-1-${post.id}`}>
                  <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                  <span className="ticker-sep">*</span>
                </span>
              ))}
          {hasCustomItems
            ? topBarItems.map((item, index) => (
                <span key={`ticker-custom-2-${index}`}>
                  <span className="ticker-item-text">{item}</span>
                  <span className="ticker-sep">*</span>
                </span>
              ))
            : posts.map((post) => (
                <span key={`ticker-post-2-${post.id}`}>
                  <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                  <span className="ticker-sep">*</span>
                </span>
              ))}
        </div>
      </div>
      <div className="ticker-date">{dateStr}</div>
    </div>
  );
}
