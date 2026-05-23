import Image from "next/image";
import Link from "next/link";

const menuLinks = [
  { href: "/", label: "Home" },
  { href: "/posts", label: "Posts" },
  { href: "/football", label: "Live Data" },
  { href: "/#latest", label: "Latest" },
  { href: "/contact", label: "Contact" },
];

export default async function Navbar() {
  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo" aria-label="KickInfoMedia home">
            <Image
              src="https://res.cloudinary.com/dzqgmdo4e/image/upload/v1779519885/logo_yfbcyy.jpg"
              alt="KickInfoMedia"
              width={154}
              height={44}
              className="nav-logo-img"
              priority
            />
          </Link>
          <div className="nav-menu">
            {menuLinks.map(item => (
              <Link key={item.href} href={item.href} className="nav-cat">
                {item.label}
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
            <Link href="/admin/login" className="nav-login" aria-label="Login">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>
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
