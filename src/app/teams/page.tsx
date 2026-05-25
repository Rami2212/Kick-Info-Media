import Image from "next/image";
import Link from "next/link";
import { listTeams, teamCountryToSlug } from "@/lib/teams";
import { TEAM_GROUPS } from "@/lib/teamGroups";
import { AdSideRail, AutoStackedAdSideRail } from "@/app/components/ads/Ads";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeamsPage() {
  const teams = await listTeams({ publishedOnly: true });
  const teamsByGroup = new Map<string, typeof teams>();

  for (const group of TEAM_GROUPS) {
    teamsByGroup.set(group, teams.filter((team) => team.group === group).slice(0, 4));
  }

  return (
    <>
      <div className="divider"></div>
      <section className="teams-layout">
        <aside className="teams-layout-side teams-layout-side-left">
          <AdSideRail size="160x600" smartLinkLabel="Sponsor" />
        </aside>

        <div className="teams-layout-main">
          <header className="posts-head">
            <div>
              <p className="blog-sub">National Squads</p>
              <h1 className="blog-title">Teams</h1>
            </div>
          </header>

          {teams.length > 0 ? (
            <div className="teams-groups-wrap">
              {TEAM_GROUPS.map((group) => {
                const groupTeams = teamsByGroup.get(group) || [];
                return (
                  <section key={group} className="teams-group-section">
                    <div className="section-head">
                      <span className="section-label">{group}</span>
                      <div className="section-line"></div>
                    </div>

                    {groupTeams.length > 0 ? (
                      <div className="teams-group-grid">
                        {groupTeams.map((team) => (
                          <Link key={team.id} href={`/teams/${teamCountryToSlug(team.country)}`} className="team-card-link">
                            <article className="team-card">
                              {/^https?:\/\//i.test(team.cover_image_url || team.team_image_url) ? (
                                <Image
                                  src={team.cover_image_url || team.team_image_url}
                                  alt={team.country}
                                  width={640}
                                  height={360}
                                  className="team-card-image"
                                />
                              ) : (
                                <div className="team-card-image team-card-image-placeholder">No Image</div>
                              )}
                              <div className="team-card-body">
                                <h2 className="team-card-name">{team.country}</h2>
                              </div>
                            </article>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="admin-panel">
                        <p className="empty-state-desc">No teams in this group yet.</p>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="admin-panel">
              <p className="empty-state-desc">
                No teams published yet.
              </p>
            </div>
          )}
        </div>

        <aside className="teams-layout-side teams-layout-side-right">
          <AutoStackedAdSideRail
            size="160x300"
            smartLinkLabel="Partner"
            targetSelector=".teams-layout-main"
            minSlots={1}
            maxSlots={10}
          />
        </aside>
      </section>
    </>
  );
}
