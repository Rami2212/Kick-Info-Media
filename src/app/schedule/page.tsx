import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Schedule | KickInfoMedia",
  description: "World Cup schedule and bracket page for upcoming matches and game picks.",
  keywords: mergeSeoKeywords(["world cup schedule", "football fixtures", "match bracket"], SEO_DEFAULT_KEYWORDS),
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SchedulePageRedirect() {
  redirect("/fifa-game");
}
