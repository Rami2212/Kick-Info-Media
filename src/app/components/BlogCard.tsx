import Link from "next/link";

type BlogCardProps = {
  slug: string;
  title: string;
  excerpt: string;
  categoryName?: string;
  published: boolean;
  createdAt: string;
  accentColor?: 'blue' | 'green';
};

export default function BlogCard({
  slug,
  title,
  excerpt,
  categoryName,
  published,
  createdAt,
  accentColor
}: BlogCardProps) {
  const dateStr = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Link href={`/posts/${slug}`} className="blog-card">
      {published && <div className="blog-published">Published</div>}
      <span className={`blog-cat-badge ${accentColor === 'green' ? 'green' : ''}`}>
        {categoryName || 'Article'}
      </span>
      <h3 className="blog-card-title">{title}</h3>
      <p className="blog-excerpt">{excerpt}</p>
      <div className="blog-meta">
        <div className="blog-author">
          <div className="author-avatar">E</div>
          <span className="author-name">Editorial</span>
        </div>
        <span className="blog-date">{dateStr}</span>
      </div>
      <div 
        className="card-line" 
        style={accentColor === 'green' ? { background: 'var(--green)' } : {}}
      ></div>
    </Link>
  );
}
