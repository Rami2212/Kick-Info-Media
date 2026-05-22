import { listCategories } from "@/lib/categories";
import Link from "next/link";

export default async function Footer() {
  const categories = await listCategories();
  
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div className="footer-logo-text">Kick<span className="blue">Info</span><span className="green">Media</span></div>
            <p className="footer-desc">The premier destination for breaking football news, tactical analysis, and live coverage from across the globe.</p>
          </div>
          <div>
            <p className="footer-col-title">Sports</p>
            <div className="footer-links">
              {categories.slice(0, 5).map(cat => (
                <Link key={cat.id} href={`/category/${cat.slug}`} className="footer-link">
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="footer-col-title">Company</p>
            <div className="footer-links">
              <Link href="#" className="footer-link">About Us</Link>
              <Link href="#" className="footer-link">Careers</Link>
              <Link href="/contact" className="footer-link">Contact</Link>
              <Link href="#" className="footer-link">Privacy Policy</Link>
              <Link href="#" className="footer-link">Terms of Service</Link>
            </div>
          </div>
          <div>
            <p className="footer-col-title">Stay Updated</p>
            <p className="footer-desc" style={{ marginTop: 0, marginBottom: '12px' }}>Daily football news and analysis delivered to your inbox.</p>
            <input className="nl-input" type="email" placeholder="Your email address" style={{ marginBottom: '6px' }} />
            <button className="nl-btn">Subscribe</button>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© {new Date().getFullYear()} Kick Info Media. All rights reserved.</p>
          <div className="footer-socials">
            <Link href="#" className="footer-social">Twitter</Link>
            <Link href="#" className="footer-social">Instagram</Link>
            <Link href="#" className="footer-social">YouTube</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
