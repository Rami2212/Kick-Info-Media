import type { Metadata } from "next";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Admin | KickInfoMedia",
  description: "KickInfoMedia administration login and dashboard.",
  keywords: mergeSeoKeywords(["admin login", "site administration"], SEO_DEFAULT_KEYWORDS),
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
