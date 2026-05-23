import Image from "next/image";
import Link from "next/link";

type CategoryGridProps = {
  categories: Array<{
    slug: string;
    name: string;
    imageUrl?: string;
    articleCount: number;
  }>;
};

const categoryIcons: Record<string, string> = {
  football: '⚽', 
  transfers: '🔄', 
  ucl: '🏆', 
  'champions-league': '🏆',
  'premier-league': '🦁', 
  'la-liga': '🌞', 
  bundesliga: '🦅',
  analysis: '📊', 
  'world-cup': '🌍', 
  default: '📰',
};

export default function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="cats">
      <div className="cats-inner">
        <div className="cats-head">
          <div>
            <p className="cats-sub">Browse by Sport</p>
            <h2 className="cats-title">Categories</h2>
          </div>
          <Link href="#" className="section-all">All Categories →</Link>
        </div>
        <div className="cats-grid">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`} className="cat-card">
              {cat.imageUrl ? (
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  width={46}
                  height={46}
                  className="cat-image"
                />
              ) : (
                <span className="cat-icon">{categoryIcons[cat.slug] || categoryIcons.default}</span>
              )}
              <p className="cat-name">{cat.name}</p>
              <p className="cat-count">{cat.articleCount} articles</p>
              <div className="cat-bar"></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
