import type { Metadata } from "next";
import { auth } from "@/lib/googleAuth";
import {
  getScheduleBracketSettings,
  getScheduleGroupStageSettings,
  getSiteSettings,
} from "@/lib/siteSettings";
import ScheduleBracketClient from "@/app/schedule/ScheduleBracketClient";
import { AdSideRail, AutoStackedAdSideRail } from "@/app/components/ads/Ads";

export const metadata: Metadata = {
  title: "FIFA Game | KickInfoMedia",
  description: "FIFA game bracket with editable groups, third-place picks, and knockout flow.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FifaGamePage() {
  const [session, settings] = await Promise.all([auth(), getSiteSettings()]);
  const bracket = getScheduleBracketSettings(settings);
  const groupStage = getScheduleGroupStageSettings(settings);

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
            initialSlots={bracket.slots}
            initialGroups={groupStage.groups}
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
