import type { Metadata } from "next";
import { auth } from "@/lib/googleAuth";
import {
  getScheduleBracketSettings,
  getScheduleGroupStageSettings,
  getSiteSettings,
} from "@/lib/siteSettings";
import { resetScheduleBracketUserPicks } from "@/lib/scheduleBracket";
import { getUserScheduleGame } from "@/lib/userScheduleGame";
import ScheduleBracketClient from "@/app/schedule/ScheduleBracketClient";
import { AdSideRail } from "@/app/components/ads/Ads";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FIFA Game | KickInfoMedia",
  description: "FIFA game bracket with editable groups, third-place picks, and knockout flow.",
  keywords: mergeSeoKeywords(
    ["fifa game", "world cup bracket game", "group stage predictions", "knockout picks"],
    SEO_DEFAULT_KEYWORDS,
  ),
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FifaGamePage() {
  const [session, settings] = await Promise.all([auth(), getSiteSettings()]);
  const defaultBracket = getScheduleBracketSettings(settings);
  const defaultGroupStage = getScheduleGroupStageSettings(settings);
  const userId = session?.user?.id ? String(session.user.id) : "";
  const userGame = userId ? await getUserScheduleGame(userId) : null;
  const isFirstGameForUser = !!userId && !userGame;
  const initialSlots = userGame?.slots || resetScheduleBracketUserPicks(defaultBracket.slots);
  const initialGroups = userGame?.groups || defaultGroupStage.groups;

  return (
    <main className="schedule-page fifa-game-page">
      <div className="schedule-shell fifa-game-shell">
        <aside className="schedule-page-side schedule-page-side-left">
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        </aside>

        <section className="schedule-main fifa-game-main">
          <section className="schedule-head">
            <p className="blog-sub">FIFA</p>
            <h1 className="blog-title">FIFA Game</h1>
          </section>

          <ScheduleBracketClient
            initialSlots={initialSlots}
            initialGroups={initialGroups}
            catalogGroups={defaultGroupStage.groups}
            startEmptySelection={isFirstGameForUser}
            isLoggedIn={!!session?.user?.id}
          />
        </section>

        <aside className="schedule-page-side schedule-page-side-right">
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        </aside>
      </div>
    </main>
  );
}
