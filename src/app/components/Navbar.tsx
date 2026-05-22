import { listCategories } from "@/lib/categories";
import Link from "next/link";

export default async function Navbar() {
  const categories = await listCategories();
  
  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="logo-icon">
              <div className="logo-ball"></div>
              <div className="logo-swoosh"></div>
              <div className="logo-swoosh2"></div>
            </div>
            <div className="logo-text">Kick<span className="blue">Info</span><span className="green">Media</span></div>
          </Link>
          <div className="nav-cats">
            {categories.map(cat => (
              <Link key={cat.id} href={`/category/${cat.slug}`} className="nav-cat">
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="nav-actions">
            <button className="nav-search" aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>
            <Link href="#" className="nav-subscribe">
              <div className="pulse"></div> Subscribe
            </Link>
          </div>
        </div>
      </nav>
      <div className="divider"></div>
    </>
  );
}
