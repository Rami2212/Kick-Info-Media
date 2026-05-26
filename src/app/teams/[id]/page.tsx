import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTeamBySlugOrId } from "@/lib/teams";
import { AdSideRail } from "@/app/components/ads/Ads";
import { sanitizeRichHtml } from "@/lib/security";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const team = await getTeamBySlugOrId(id);

  if (!team || !team.published) {
    return {
      title: "Team Not Found | KickInfoMedia",
      description: "The requested team page is unavailable.",
      keywords: SEO_DEFAULT_KEYWORDS,
    };
  }

  return {
    title: `${team.country} Team | KickInfoMedia`,
    description: `Profile, group details, and squad updates for ${team.country}.`,
    keywords: mergeSeoKeywords(
      [team.country, team.group, "national team", "world cup squad"],
      SEO_DEFAULT_KEYWORDS,
    ),
  };
}

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params;
  const team = await getTeamBySlugOrId(id);

  if (!team || !team.published) {
    notFound();
  }

  return (
    <>
      <div className="divider"></div>
      <section className="team-single-layout">
        <aside className="team-single-side team-single-side-left">
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        </aside>

        <article className="team-single-main">
          <div className="team-single-inner">
            <div className="team-single-left">
              <div className="team-single-head-row">
                {/^https?:\/\//i.test(team.cover_image_url || team.team_image_url) ? (
                  <Image
                    src={team.cover_image_url || team.team_image_url}
                    alt={team.country}
                    width={240}
                    height={150}
                    quality={100}
                    className="team-single-image team-single-cover-image"
                    priority
                  />
                ) : (
                  <div className="team-single-image team-single-cover-image team-single-image-placeholder">
                    No Cover
                  </div>
                )}

                <div className="team-single-head">
                  <h1 className="team-single-country">{team.country}</h1>
                  <p className="team-single-group">{team.group}</p>
                </div>
              </div>

              {/^https?:\/\//i.test(team.team_image_url || team.cover_image_url) ? (
                <Image
                  src={team.team_image_url || team.cover_image_url}
                  alt={`${team.country} team`}
                  width={1122}
                  height={1402}
                  quality={92}
                  className="team-single-image team-single-team-image"
                  priority
                />
              ) : (
                <div className="team-single-image team-single-team-image team-single-image-placeholder">
                  No Team Image
                </div>
              )}
            </div>

            <div className="team-single-description-wrap">
              <div className="team-single-description" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(team.description || "") }} />

              <div className="team-single-actions">
                <Link href="/teams" className="home-triple-link">
                  Back to Teams -&gt;
                </Link>
              </div>
            </div>
          </div>
        </article>

        <aside className="team-single-side team-single-side-right">
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        </aside>
      </section>
    </>
  );
}
