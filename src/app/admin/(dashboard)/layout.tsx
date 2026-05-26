import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminAuth } from "@/lib/adminAuth";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Admin Dashboard | KickInfoMedia",
  description: "KickInfoMedia admin dashboard for posts, teams, products, users, and site settings.",
  keywords: mergeSeoKeywords(["admin dashboard", "content management", "site settings"], SEO_DEFAULT_KEYWORDS),
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdminAuth();
  
  if (!auth.ok) {
    return (
      <div className="admin-shell flex items-center justify-center p-5">
        <div className="admin-panel max-w-md w-full text-center">
          <h2 className="font-display text-[28px] text-[#e8e9e9] mb-3">Access Denied</h2>
          <p className="font-body text-[12px] text-white/50 mb-6">
            Your account ({auth.email}) does not have administrator privileges.
          </p>
          <Link href="/" className="font-heading text-[10px] uppercase tracking-[0.2em] text-[#7fb525] hover:text-white">
            Return to site →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-container min-h-[68px] py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/admin" className="font-display text-[20px] tracking-[0.12em]">
            Kick<span className="text-[#1877c1]">Info</span><em className="text-[#7fb525] not-italic">Media</em>
            <span className="ml-2 text-[10px] font-heading uppercase tracking-[0.25em] text-white/40">Admin</span>
          </Link>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-heading text-[10px] uppercase tracking-[0.16em] text-white/40 break-all">{auth.email}</span>
            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="font-heading text-[10px] uppercase tracking-[0.2em] text-[#7fb525] hover:text-white"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="admin-container admin-grid">
        <aside className="admin-sidebar overflow-hidden lg:sticky lg:top-6 lg:self-start">
          <div className="admin-sidebar-head">
            <p className="font-heading text-[10px] uppercase tracking-[0.25em] text-[#7fb525]">Admin Console</p>
          </div>
          <nav className="admin-sidebar-nav">
            {[
              { href: "/admin", label: "Dashboard" },
              { href: "/admin/posts", label: "Posts" },
              { href: "/admin/products", label: "Products" },
              { href: "/admin/teams", label: "Teams" },
              { href: "/admin/categories", label: "Categories" },
              { href: "/admin/users", label: "Users" },
              { href: "/admin/site-settings", label: "Site Settings" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="admin-sidebar-link"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
