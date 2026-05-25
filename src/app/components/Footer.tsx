import { listCategories } from "@/lib/categories";
import Image from "next/image";
import Link from "next/link";

export default async function Footer() {
  const categories = await listCategories();
  
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <Link href="/" className="footer-logo-link" aria-label="KickInfoMedia home">
              <Image
                src="https://res.cloudinary.com/dzqgmdo4e/image/upload/v1779519885/logo_yfbcyy.jpg"
                alt="KickInfoMedia"
                width={180}
                height={52}
                className="footer-logo-img"
              />
            </Link>
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
            <a
              href="https://www.facebook.com/profile.php?id=61590138485526"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-icon-link"
              aria-label="KickInfoMedia on Facebook"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M13.3 21v-8h2.7l.4-3.1h-3.1V8c0-.9.2-1.5 1.5-1.5h1.7V3.8c-.8-.1-1.5-.1-2.3-.1-2.3 0-3.8 1.4-3.8 4v2.2H8v3.1h2.4v8h2.9Z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/kickinfomedia/?fbclid=IwY2xjawSA6HxleHRuA2FlbQIxMQBicmlkETFjcURGUlUwMEgzZkVFTW5yc3J0YwZhcHBfaWQBMAABHsoM3hJw_dLOuwxYgPdIVU2vU1VxNcJzwKiw2ucGUmN8818uwpZqg7iG4sYh_aem_jglnlHu4_lA2qpt_TSOvBg"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-icon-link"
              aria-label="KickInfoMedia on Instagram"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2Zm0 1.9A3.9 3.9 0 0 0 3.9 7.8v8.4c0 2.2 1.7 3.9 3.9 3.9h8.4a3.9 3.9 0 0 0 3.9-3.9V7.8a3.9 3.9 0 0 0-3.9-3.9H7.8Zm8.8 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 6.7a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6Zm0 1.9a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com/channel/UCuLLcti1T7YKEta71iCXQVA"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-icon-link"
              aria-label="KickInfoMedia on YouTube"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M21.6 7.2a2.7 2.7 0 0 0-1.9-2C18 4.7 12 4.7 12 4.7s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 2A28 28 0 0 0 2 12c0 1.6.1 3.2.4 4.8a2.7 2.7 0 0 0 1.9 2c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-2c.3-1.6.4-3.2.4-4.8 0-1.6-.1-3.2-.4-4.8ZM10 15.3V8.7l5.7 3.3-5.7 3.3Z" />
              </svg>
            </a>
            <a
              href="https://x.com/KickInfoMedia"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-icon-link"
              aria-label="KickInfoMedia on X"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M18.2 3H21l-6 6.9L22 21h-5.6l-4.4-5.7L6.9 21H4l6.4-7.3L2 3h5.7l4 5.3L18.2 3Zm-1 16.3h1.6L7.8 4.6H6.1l11.1 14.7Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
