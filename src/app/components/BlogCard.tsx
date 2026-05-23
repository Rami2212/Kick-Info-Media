import Image from "next/image";
import Link from "next/link";

type BlogCardProps = {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl?: string;
  categoryName?: string;
  published: boolean;
  createdAt: string;
  accentColor?: 'blue' | 'green';
};

export default function BlogCard({
  slug,
  title,
  excerpt,
  coverImageUrl,
  categoryName,
  createdAt,
  accentColor
}: BlogCardProps) {
  const validCoverImageUrl =
    typeof coverImageUrl === "string" &&
    /^https?:\/\//i.test(coverImageUrl) &&
    coverImageUrl.trim().length > 0
      ? coverImageUrl
      : "";

  const dateStr = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = new Date(createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Link href={`/posts/${slug}`} className="blog-card">
      <div className={`blog-card-tag ${accentColor === 'green' ? 'green' : ''}`}>
        {categoryName || 'Article'}
      </div>
      {validCoverImageUrl ? (
        <Image
          src={validCoverImageUrl}
          alt={title}
          width={640}
          height={360}
          className="blog-cover-image"
        />
      ) : null}
      <h3 className="blog-card-title">{title}</h3>
      <p className="blog-excerpt">{excerpt}</p>
      <div className="blog-meta">
        <div className="blog-author blog-time">
          <span className="author-name">{dateStr}</span>
          <span className="blog-time-sep">|</span>
          <span className="blog-date">{timeStr}</span>
        </div>
        <span className="blog-read-more">Read More</span>
      </div>
      <div 
        className="card-line" 
        style={accentColor === 'green' ? { background: 'var(--green)' } : {}}
      ></div>
    </Link>
  );
}
