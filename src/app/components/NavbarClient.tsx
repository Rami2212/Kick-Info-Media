"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import UserLogoutButton from "./UserLogoutButton";

type NavbarClientProps = {
  loggedIn: boolean;
};

const menuLinks = [
  { href: "/", label: "Home" },
  { href: "/posts", label: "Posts" },
  { href: "/teams", label: "Teams" },
  { href: "/fifa-world-cup", label: "FIFA World Cup" },
  { href: "/live", label: "Live" },
  { href: "/rankings", label: "Rankings" },
  { href: "/football", label: "Live Data" },
];

export default function NavbarClient({ loggedIn }: NavbarClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!accountMenuRef.current?.contains(target)) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [accountMenuOpen]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }

  function toggleMobileMenu() {
    setMobileMenuOpen((prev) => {
      const next = !prev;
      if (next) setAccountMenuOpen(false);
      return next;
    });
  }

  function toggleAccountMenu() {
    setAccountMenuOpen((prev) => {
      const next = !prev;
      if (next) setMobileMenuOpen(false);
      return next;
    });
  }

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo" aria-label="KickInfoMedia home" onClick={closeMobileMenu}>
            <Image
              src="https://res.cloudinary.com/dzqgmdo4e/image/upload/v1779519885/logo_yfbcyy.jpg"
              alt="KickInfoMedia"
              width={154}
              height={44}
              className="nav-logo-img"
              priority
            />
          </Link>

          <button
            type="button"
            className={`nav-mobile-toggle${mobileMenuOpen ? " open" : ""}`}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={toggleMobileMenu}
          >
            <span className="nav-mobile-line" />
            <span className="nav-mobile-line" />
            <span className="nav-mobile-line" />
          </button>

          <div className={`nav-menu${mobileMenuOpen ? " nav-menu-open" : ""}`}>
            <div className="nav-menu-links">
              {menuLinks.map((item) => (
                <Link key={item.href} href={item.href} className="nav-cat" onClick={closeMobileMenu}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="nav-actions">
            <button className="nav-search" aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            <div className="nav-account" ref={accountMenuRef}>
              <button
                type="button"
                className="nav-account-toggle"
                aria-label="Account menu"
                aria-expanded={accountMenuOpen}
                onClick={toggleAccountMenu}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
              </button>

              {accountMenuOpen && (
                <div className="nav-account-menu open" role="menu" aria-label="Account links">
                  {loggedIn ? (
                    <>
                      <Link href="/profile" className="nav-account-item" onClick={() => setAccountMenuOpen(false)}>
                        Profile
                      </Link>
                      <UserLogoutButton className="nav-account-item nav-account-item-button" label="Logout" />
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="nav-account-item" onClick={() => setAccountMenuOpen(false)}>
                        Login
                      </Link>
                      <Link href="/register" className="nav-account-item" onClick={() => setAccountMenuOpen(false)}>
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

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
