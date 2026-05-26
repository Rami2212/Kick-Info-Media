"use client";

import { useEffect, useState } from "react";
import { DEFAULT_RANKINGS_JSON, parseRankingsJsonText } from "@/lib/rankings";
import {
  DEFAULT_SCHEDULE_BRACKET_JSON,
  parseScheduleBracketJsonText,
  type ScheduleBracketSlot,
} from "@/lib/scheduleBracket";
import {
  DEFAULT_SCHEDULE_GROUP_STAGE_JSON,
  parseScheduleGroupStageJsonText,
  type ScheduleGroup,
} from "@/lib/scheduleGroupStage";
import {
  DEFAULT_FIFA_SCHEDULE_JSON,
  parseFifaScheduleJsonText,
  type FifaScheduleFixture,
} from "@/lib/fifaSchedule";
import {
  DEFAULT_LIVE_MATCH_JSON,
  parseLiveMatchJsonText,
  type LiveMatchData,
  type LiveMatchLineupPlayer,
} from "@/lib/liveMatch";

type BlogOption = {
  id: string;
  title: string;
  published: boolean;
};

type SettingsFormData = {
  topBarText: string;
  topBarItemsText: string;
  liveMatchJson: string;
  popunderAdsEnabled: boolean;
  socialBarAdsEnabled: boolean;
  heroPostIds: string[];
  topStoryPostIds: string[];
  nextMatchId: string;
  nextMatchTeamAName: string;
  nextMatchTeamAFlagImageUrl: string;
  nextMatchTeamBName: string;
  nextMatchTeamBFlagImageUrl: string;
  scheduleGroupStageJson: string;
  scheduleBracketJson: string;
  fifaScheduleJson: string;
  rankingsJson: string;
};

const ROUND32_MATCH_SLOT_MAP: Array<{ matchId: string; slotA: number; slotB: number }> = [
  { matchId: "M74", slotA: 1, slotB: 2 },
  { matchId: "M77", slotA: 3, slotB: 4 },
  { matchId: "M73", slotA: 5, slotB: 6 },
  { matchId: "M75", slotA: 7, slotB: 8 },
  { matchId: "M83", slotA: 9, slotB: 10 },
  { matchId: "M84", slotA: 11, slotB: 12 },
  { matchId: "M81", slotA: 13, slotB: 14 },
  { matchId: "M82", slotA: 15, slotB: 16 },
  { matchId: "M76", slotA: 47, slotB: 48 },
  { matchId: "M78", slotA: 49, slotB: 50 },
  { matchId: "M79", slotA: 51, slotB: 52 },
  { matchId: "M80", slotA: 53, slotB: 54 },
  { matchId: "M86", slotA: 55, slotB: 56 },
  { matchId: "M88", slotA: 57, slotB: 58 },
  { matchId: "M85", slotA: 59, slotB: 60 },
  { matchId: "M87", slotA: 61, slotB: 62 },
];

function normalizePostIds(value: unknown): string[] {
  if (!Array.isArray(value)) return ["", "", "", ""];
  return Array.from({ length: 4 }, (_, index) => (typeof value[index] === "string" ? value[index] : ""));
}

function parseTopBarItems(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function parseEditableBracketJson(value: string): { slots: ScheduleBracketSlot[] } | null {
  try {
    const parsed = JSON.parse(value) as { slots?: unknown };
    if (!Array.isArray(parsed.slots)) return null;

    return {
      slots: parsed.slots
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const slot = item as { id?: unknown; code?: unknown; name?: unknown; flagImageUrl?: unknown };
          const id = typeof slot.id === "number" ? slot.id : Number(slot.id);
          if (!Number.isFinite(id)) return null;
          return {
            id,
            code: normalizeText(slot.code),
            name: normalizeText(slot.name),
            flagImageUrl: normalizeText(slot.flagImageUrl),
          };
        })
        .filter((slot): slot is ScheduleBracketSlot => !!slot),
    };
  } catch {
    return null;
  }
}

function parseEditableGroupStageJson(value: string): { groups: ScheduleGroup[] } | null {
  try {
    const parsed = JSON.parse(value) as { groups?: unknown };
    if (!Array.isArray(parsed.groups)) return null;

    return {
      groups: parsed.groups
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const group = item as { id?: unknown; name?: unknown; teams?: unknown };
          if (!Array.isArray(group.teams)) return null;
          return {
            id: normalizeText(group.id),
            name: normalizeText(group.name),
            teams: group.teams.map((teamItem) => {
              const team = teamItem && typeof teamItem === "object"
                ? teamItem as { code?: unknown; name?: unknown; flagImageUrl?: unknown }
                : {};
              return {
                code: normalizeText(team.code),
                name: normalizeText(team.name),
                flagImageUrl: normalizeText(team.flagImageUrl),
              };
            }),
          };
        })
        .filter((group): group is ScheduleGroup => !!group),
    };
  } catch {
    return null;
  }
}

function parseEditableFifaScheduleJson(value: string): { fixtures: FifaScheduleFixture[] } | null {
  try {
    const parsed = JSON.parse(value) as { fixtures?: unknown };
    if (!Array.isArray(parsed.fixtures)) return null;

    const fixtures: FifaScheduleFixture[] = [];

    for (const item of parsed.fixtures) {
      if (!item || typeof item !== "object") continue;
      const fixture = item as Record<string, unknown>;
      const slotA = typeof fixture.slotA === "number" ? fixture.slotA : Number(fixture.slotA);
      const slotB = typeof fixture.slotB === "number" ? fixture.slotB : Number(fixture.slotB);
      if (!Number.isFinite(slotA) || !Number.isFinite(slotB)) continue;

      const teamA = fixture.teamA && typeof fixture.teamA === "object"
        ? fixture.teamA as Record<string, unknown>
        : {};
      const teamB = fixture.teamB && typeof fixture.teamB === "object"
        ? fixture.teamB as Record<string, unknown>
        : {};

      fixtures.push({
        id: normalizeText(fixture.id),
        stage: normalizeText(fixture.stage),
        date: normalizeText(fixture.date),
        time: normalizeText(fixture.time),
        slotA,
        slotB,
        teamA: {
          name: normalizeText(teamA.name),
          flagImageUrl: normalizeText(teamA.flagImageUrl),
        },
        teamB: {
          name: normalizeText(teamB.name),
          flagImageUrl: normalizeText(teamB.flagImageUrl),
        },
      });
    }

    return {
      fixtures,
    };
  } catch {
    return null;
  }
}

export default function SiteSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<BlogOption[]>([]);

  const [formData, setFormData] = useState<SettingsFormData>({
    topBarText: "",
    topBarItemsText: "",
    liveMatchJson: DEFAULT_LIVE_MATCH_JSON,
    popunderAdsEnabled: false,
    socialBarAdsEnabled: false,
    heroPostIds: ["", "", "", ""],
    topStoryPostIds: ["", "", "", ""],
    nextMatchId: "M1",
    nextMatchTeamAName: "",
    nextMatchTeamAFlagImageUrl: "",
    nextMatchTeamBName: "",
    nextMatchTeamBFlagImageUrl: "",
    scheduleGroupStageJson: DEFAULT_SCHEDULE_GROUP_STAGE_JSON,
    scheduleBracketJson: DEFAULT_SCHEDULE_BRACKET_JSON,
    fifaScheduleJson: DEFAULT_FIFA_SCHEDULE_JSON,
    rankingsJson: DEFAULT_RANKINGS_JSON,
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const [settingsRes, postsRes] = await Promise.all([
          fetch("/api/site-settings"),
          fetch("/api/posts?all=true"),
        ]);

        if (postsRes.ok) {
          const postData = await postsRes.json();
          setPosts(postData);
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          const topBarItems = Array.isArray(data.extra?.topBarItems)
            ? data.extra.topBarItems.filter((item: unknown) => typeof item === "string")
            : [];

          setFormData({
            topBarText: normalizeText(data.extra?.topBarText),
            topBarItemsText: topBarItems.join("\n"),
            liveMatchJson: normalizeText(data.extra?.liveMatchJson) || DEFAULT_LIVE_MATCH_JSON,
            popunderAdsEnabled: data.extra?.popunderAdsEnabled === true,
            socialBarAdsEnabled: data.extra?.socialBarAdsEnabled === true,
            heroPostIds: normalizePostIds(data.extra?.heroPostIds),
            topStoryPostIds: normalizePostIds(data.extra?.topStoryPostIds),
            nextMatchId: normalizeText(data.extra?.nextMatchId) || "M1",
            nextMatchTeamAName: normalizeText(data.extra?.nextMatchTeamAName),
            nextMatchTeamAFlagImageUrl: normalizeText(data.extra?.nextMatchTeamAFlagImageUrl),
            nextMatchTeamBName: normalizeText(data.extra?.nextMatchTeamBName),
            nextMatchTeamBFlagImageUrl: normalizeText(data.extra?.nextMatchTeamBFlagImageUrl),
            scheduleGroupStageJson: normalizeText(data.extra?.scheduleGroupStageJson) || DEFAULT_SCHEDULE_GROUP_STAGE_JSON,
            scheduleBracketJson: normalizeText(data.extra?.scheduleBracketJson) || DEFAULT_SCHEDULE_BRACKET_JSON,
            fifaScheduleJson: normalizeText(data.extra?.fifaScheduleJson) || DEFAULT_FIFA_SCHEDULE_JSON,
            rankingsJson: normalizeText(data.extra?.rankingsJson) || DEFAULT_RANKINGS_JSON,
          });
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handlePostSelection = (group: "heroPostIds" | "topStoryPostIds", index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [group]: prev[group].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const bracketData = parseEditableBracketJson(formData.scheduleBracketJson);
  const groupStageData = parseEditableGroupStageJson(formData.scheduleGroupStageJson);
  const fifaScheduleData = parseEditableFifaScheduleJson(formData.fifaScheduleJson);
  const liveMatchData = parseLiveMatchJsonText(formData.liveMatchJson);
  const bracketSlotMap = new Map((bracketData?.slots || []).map((slot) => [slot.id, slot]));

  const handleBracketSlotChange = (
    slotId: number,
    field: keyof Pick<ScheduleBracketSlot, "code" | "name" | "flagImageUrl">,
    value: string,
  ) => {
    const current = parseEditableBracketJson(formData.scheduleBracketJson);
    if (!current) return;

    const nextSlots = current.slots.map((slot) =>
      slot.id === slotId ? { ...slot, [field]: value } : slot,
    );

    setFormData((prev) => ({
      ...prev,
      scheduleBracketJson: stringifyJson({ slots: nextSlots }),
    }));
  };

  const handleGroupTeamChange = (
    groupId: string,
    teamIndex: number,
    field: keyof ScheduleGroup["teams"][number],
    value: string,
  ) => {
    const current = parseEditableGroupStageJson(formData.scheduleGroupStageJson);
    if (!current) return;

    const nextGroups = current.groups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            teams: group.teams.map((team, index) =>
              index === teamIndex ? { ...team, [field]: value } : team,
            ),
          }
        : group,
    );

    setFormData((prev) => ({
      ...prev,
      scheduleGroupStageJson: stringifyJson({ groups: nextGroups }),
    }));
  };

  const handleFixtureTeamChange = (
    fixtureId: string,
    side: "teamA" | "teamB",
    field: "name" | "flagImageUrl",
    value: string,
  ) => {
    const current = parseEditableFifaScheduleJson(formData.fifaScheduleJson);
    if (!current) return;

    const nextFixtures = current.fixtures.map((fixture) =>
      fixture.id === fixtureId
        ? {
            ...fixture,
            [side]: {
              name: fixture[side]?.name || "",
              flagImageUrl: fixture[side]?.flagImageUrl || "",
              [field]: value,
            },
          }
        : fixture,
    );

    setFormData((prev) => ({
      ...prev,
      fifaScheduleJson: stringifyJson({ fixtures: nextFixtures }),
    }));
  };

  const handleLiveLineupPlayerChange = (
    side: "teamA" | "teamB",
    index: number,
    field: keyof LiveMatchLineupPlayer,
    value: string,
  ) => {
    const current = parseLiveMatchJsonText(formData.liveMatchJson);
    if (!current) return;

    const next: LiveMatchData = {
      ...current,
      lineups: {
        ...current.lineups,
        [side]: current.lineups[side].map((player, playerIndex) =>
          playerIndex === index ? { ...player, [field]: value } : player,
        ),
      },
    };

    setFormData((prev) => ({
      ...prev,
      liveMatchJson: stringifyJson(next),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      if (!parseRankingsJsonText(formData.rankingsJson)) {
        throw new Error("Rankings JSON is invalid. Please include men/women arrays with rank, team, and points.");
      }
      if (!parseScheduleBracketJsonText(formData.scheduleBracketJson)) {
        throw new Error("Schedule Bracket JSON is invalid. Please provide a slots array with numbered IDs.");
      }
      if (!parseScheduleGroupStageJsonText(formData.scheduleGroupStageJson)) {
        throw new Error("Schedule Group Stage JSON is invalid. Please provide 12 groups with 4 teams each.");
      }
      if (!parseFifaScheduleJsonText(formData.fifaScheduleJson)) {
        throw new Error("FIFA Schedule JSON is invalid. Please provide a fixtures array with id, stage, date, time, slotA, and slotB.");
      }
      if (!parseLiveMatchJsonText(formData.liveMatchJson)) {
        throw new Error("Live Match JSON is invalid. Please include title, teams, stats, and lineups.");
      }

      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extra: {
            topBarText: formData.topBarText,
            topBarItems: parseTopBarItems(formData.topBarItemsText),
            liveMatchJson: formData.liveMatchJson.trim(),
            popunderAdsEnabled: formData.popunderAdsEnabled,
            socialBarAdsEnabled: formData.socialBarAdsEnabled,
            heroPostIds: formData.heroPostIds,
            topStoryPostIds: formData.topStoryPostIds,
            nextMatchId: formData.nextMatchId.trim() || "M1",
            nextMatchTeamAName: formData.nextMatchTeamAName.trim(),
            nextMatchTeamAFlagImageUrl: formData.nextMatchTeamAFlagImageUrl.trim(),
            nextMatchTeamBName: formData.nextMatchTeamBName.trim(),
            nextMatchTeamBFlagImageUrl: formData.nextMatchTeamBFlagImageUrl.trim(),
            scheduleGroupStageJson: formData.scheduleGroupStageJson.trim(),
            scheduleBracketJson: formData.scheduleBracketJson.trim(),
            fifaScheduleJson: formData.fifaScheduleJson.trim(),
            rankingsJson: formData.rankingsJson.trim(),
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update settings");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-white/40">Loading settings...</div>;

  const renderPostSelect = (group: "heroPostIds" | "topStoryPostIds", index: number) => (
    <select
      value={formData[group][index]}
      onChange={(e) => handlePostSelection(group, index, e.target.value)}
      className="admin-select"
    >
      <option value="">Auto latest post</option>
      {posts.map((post) => (
        <option key={post.id} value={post.id}>
          {post.title}
          {post.published ? "" : " (Draft)"}
        </option>
      ))}
    </select>
  );

  return (
      <div className="admin-page admin-stack-lg">
      <div className="admin-panel space-y-2">
        <p className="admin-kicker">Configuration</p>
        <h2 className="admin-title">Site Settings</h2>
        <p className="admin-subtitle">
          Manage top bar text, live match stats, ads toggles, homepage blog placement, fan poll teams, schedule group JSON,
          schedule bracket JSON, and rankings JSON.
        </p>
      </div>

      {success && (
        <div className="admin-alert admin-alert-success">
          Settings updated successfully!
        </div>
      )}

      {error && (
        <div className="admin-alert admin-alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-stack-md">
        <section className="admin-panel space-y-5">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-display text-[18px] text-[#e8e9e9]">Top Bar Configuration</h3>
          </div>

          <div className="admin-field">
            <label className="admin-label">Top Bar Label</label>
            <input
              type="text"
              name="topBarText"
              value={formData.topBarText}
              onChange={handleChange}
              className="admin-input"
              placeholder="Breaking"
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Sliding Text Items</label>
            <textarea
              name="topBarItemsText"
              value={formData.topBarItemsText}
              onChange={handleChange}
              className="admin-textarea"
              rows={7}
              placeholder={"One line per item\nTransfer deadline moves to July 15\nDerby preview: tactical keys to watch"}
            />
          </div>
        </section>

        <section className="admin-panel space-y-5">
          <div className="space-y-2">
            <h3 className="font-display text-[18px] text-[#e8e9e9]">Live Match Stats & Lineup</h3>
            <p className="admin-subtitle">
              Controls the /live match center. Team flags can use any image URL and may be left blank.
            </p>
          </div>
          {liveMatchData ? (
            <div className="space-y-4">
              <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-[#7fb525]">Full Lineup (Starting XI)</p>
              <div className="grid gap-4 md:grid-cols-2">
                {(["teamA", "teamB"] as const).map((side) => (
                  <article key={side} className="rounded border border-white/10 bg-black/20 p-4">
                    <h4 className="font-heading text-[12px] uppercase tracking-[0.16em] text-white/80">
                      {side === "teamA" ? liveMatchData.teamA.name : liveMatchData.teamB.name}
                    </h4>
                    <div className="mt-3 space-y-2">
                      {liveMatchData.lineups[side].map((player, index) => (
                        <div key={`${side}-${index}`} className="grid gap-2 sm:grid-cols-[76px_1fr]">
                          <input
                            type="text"
                            value={player.position}
                            onChange={(event) =>
                              handleLiveLineupPlayerChange(side, index, "position", event.target.value)
                            }
                            className="admin-input h-9"
                            placeholder="POS"
                          />
                          <input
                            type="text"
                            value={player.name}
                            onChange={(event) =>
                              handleLiveLineupPlayerChange(side, index, "name", event.target.value)
                            }
                            className="admin-input h-9"
                            placeholder="Player name"
                          />
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="admin-alert admin-alert-error">
              Fix the Live Match JSON below before editing lineup fields.
            </div>
          )}
          <div className="admin-field">
            <label className="admin-label">Live Match Data JSON</label>
            <textarea
              name="liveMatchJson"
              value={formData.liveMatchJson}
              onChange={handleChange}
              className="admin-textarea"
              rows={24}
              spellCheck={false}
            />
          </div>
        </section>

        <section className="admin-panel space-y-5">
          <div className="space-y-2">
            <h3 className="font-display text-[18px] text-[#e8e9e9]">Ads Configuration</h3>
            <p className="admin-subtitle">
              Popunder and Social Bar scripts can be enabled or disabled globally from here.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <label className="inline-flex items-center gap-3 text-[13px] text-white/80">
              <input
                type="checkbox"
                name="popunderAdsEnabled"
                checked={formData.popunderAdsEnabled}
                onChange={handleCheckboxChange}
                className="h-4 w-4 accent-[#7fb525]"
              />
              Enable Popunder Ads
            </label>
            <label className="inline-flex items-center gap-3 text-[13px] text-white/80">
              <input
                type="checkbox"
                name="socialBarAdsEnabled"
                checked={formData.socialBarAdsEnabled}
                onChange={handleCheckboxChange}
                className="h-4 w-4 accent-[#7fb525]"
              />
              Enable Social Bar Ads
            </label>
          </div>
        </section>

        <section className="admin-panel space-y-5">
          <h3 className="font-display text-[18px] text-[#e8e9e9]">Homepage Blog Placement</h3>

          <div className="admin-form-grid-2">
            <div className="space-y-5">
              <p className="font-heading text-[10px] uppercase tracking-[0.22em] text-[#7fb525]">Hero Section</p>
              {[0, 1, 2, 3].map((index) => (
                <div key={`hero-${index}`} className="admin-field">
                  <label className="admin-label">Hero Place {index + 1}</label>
                  {renderPostSelect("heroPostIds", index)}
                </div>
              ))}
            </div>

            <div className="space-y-5">
              <p className="font-heading text-[10px] uppercase tracking-[0.22em] text-[#1877c1]">Top Stories</p>
              {[0, 1, 2, 3].map((index) => (
                <div key={`top-story-${index}`} className="admin-field">
                  <label className="admin-label">Top Story Place {index + 1}</label>
                  {renderPostSelect("topStoryPostIds", index)}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="admin-panel space-y-5">
          <div className="space-y-2">
            <h3 className="font-display text-[18px] text-[#e8e9e9]">Next Match Poll</h3>
            <p className="admin-subtitle">
              Set two countries for the next match. Both country names and votes are stored in MongoDB.
            </p>
          </div>

          <div className="admin-field">
            <label className="admin-label">Match ID</label>
            <input
              type="text"
              name="nextMatchId"
              value={formData.nextMatchId}
              onChange={handleChange}
              className="admin-input"
              placeholder="M1"
            />
          </div>

          <div className="admin-form-grid-2">
            <div className="space-y-5">
              <p className="font-heading text-[10px] uppercase tracking-[0.22em] text-[#7fb525]">Team A</p>

              <div className="admin-field">
                <label className="admin-label">Country Name</label>
                <input
                  type="text"
                  name="nextMatchTeamAName"
                  value={formData.nextMatchTeamAName}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="Argentina"
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">Flag URL (optional)</label>
                <input
                  type="text"
                  name="nextMatchTeamAFlagImageUrl"
                  value={formData.nextMatchTeamAFlagImageUrl}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="Leave blank to hide flag"
                />
                {formData.nextMatchTeamAFlagImageUrl && (
                  <img
                    src={formData.nextMatchTeamAFlagImageUrl}
                    alt="Team A flag preview"
                    className="mt-2 h-[40px] w-[64px] rounded border border-white/10 bg-black/30 p-1 object-contain"
                  />
                )}
              </div>
            </div>

            <div className="space-y-5">
              <p className="font-heading text-[10px] uppercase tracking-[0.22em] text-[#1877c1]">Team B</p>

              <div className="admin-field">
                <label className="admin-label">Country Name</label>
                <input
                  type="text"
                  name="nextMatchTeamBName"
                  value={formData.nextMatchTeamBName}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="France"
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">Flag URL (optional)</label>
                <input
                  type="text"
                  name="nextMatchTeamBFlagImageUrl"
                  value={formData.nextMatchTeamBFlagImageUrl}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="Leave blank to hide flag"
                />
                {formData.nextMatchTeamBFlagImageUrl && (
                  <img
                    src={formData.nextMatchTeamBFlagImageUrl}
                    alt="Team B flag preview"
                    className="mt-2 h-[40px] w-[64px] rounded border border-white/10 bg-black/30 p-1 object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Temporarily hidden per request:
            - Schedule Countries & Flags
            - Group Stage Countries & Flags
            - Schedule Group Stage JSON */}

        <section className="admin-panel space-y-5">
          <div className="space-y-2">
            <h3 className="font-display text-[18px] text-[#e8e9e9]">Schedule Bracket JSON</h3>
            <p className="admin-subtitle">
              Controls the /fifa-game page bracket. Edit slot IDs #1 to #64 with code (1A, W74...), country name, and flag URL.
            </p>
          </div>
          <div className="rounded border border-white/10 bg-black/30 p-3">
            <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-[#7fb525]">Round of 32 Match Mapping</p>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              {ROUND32_MATCH_SLOT_MAP.map((item) => (
                <p key={item.matchId} className="text-[11px] text-white/70">
                  {item.matchId}: slots #{item.slotA} and #{item.slotB}
                </p>
              ))}
            </div>
          </div>
          <div className="admin-field">
            <label className="admin-label">Schedule Bracket Data JSON</label>
            <textarea
              name="scheduleBracketJson"
              value={formData.scheduleBracketJson}
              onChange={handleChange}
              className="admin-textarea"
              rows={20}
              spellCheck={false}
            />
          </div>
        </section>

        <section className="admin-panel space-y-5">
          <div className="space-y-2">
            <h3 className="font-display text-[18px] text-[#e8e9e9]">FIFA World Cup Schedule JSON</h3>
            <p className="admin-subtitle">
              Controls the /fifa-world-cup schedule cards. You can set fixture-specific country names and flags here.
            </p>
          </div>
          {fifaScheduleData ? (
            <div className="space-y-4">
              {fifaScheduleData.fixtures.map((fixture) => {
                const teamAName = fixture.teamA?.name || "";
                const teamAFlag = fixture.teamA?.flagImageUrl || "";
                const teamBName = fixture.teamB?.name || "";
                const teamBFlag = fixture.teamB?.flagImageUrl || "";

                return (
                  <article key={fixture.id} className="rounded border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-heading text-[12px] uppercase tracking-[0.18em] text-[#7fb525]">
                        {fixture.id} - {fixture.stage}
                      </h4>
                      <span className="text-[11px] text-white/45">
                        {fixture.date} {fixture.time}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="space-y-3">
                        <p className="admin-label">Team A - Slot #{fixture.slotA}</p>
                        <input
                          type="text"
                          value={teamAName}
                          onChange={(event) => handleFixtureTeamChange(fixture.id, "teamA", "name", event.target.value)}
                          className="admin-input h-9"
                          placeholder="TBD"
                        />
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={teamAFlag}
                            onChange={(event) =>
                              handleFixtureTeamChange(fixture.id, "teamA", "flagImageUrl", event.target.value)
                            }
                            className="admin-input h-9"
                            placeholder="Leave blank to hide flag"
                          />
                          {teamAFlag ? (
                            <img
                              src={teamAFlag}
                              alt={`${teamAName || "Team A"} flag preview`}
                              className="h-[30px] w-[48px] shrink-0 rounded border border-white/10 bg-black/30 p-1 object-contain"
                            />
                          ) : (
                            <span className="h-[30px] w-[48px] shrink-0 rounded border border-white/10 bg-black/30" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="admin-label">Team B - Slot #{fixture.slotB}</p>
                        <input
                          type="text"
                          value={teamBName}
                          onChange={(event) => handleFixtureTeamChange(fixture.id, "teamB", "name", event.target.value)}
                          className="admin-input h-9"
                          placeholder="TBD"
                        />
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={teamBFlag}
                            onChange={(event) =>
                              handleFixtureTeamChange(fixture.id, "teamB", "flagImageUrl", event.target.value)
                            }
                            className="admin-input h-9"
                            placeholder="Leave blank to hide flag"
                          />
                          {teamBFlag ? (
                            <img
                              src={teamBFlag}
                              alt={`${teamBName || "Team B"} flag preview`}
                              className="h-[30px] w-[48px] shrink-0 rounded border border-white/10 bg-black/30 p-1 object-contain"
                            />
                          ) : (
                            <span className="h-[30px] w-[48px] shrink-0 rounded border border-white/10 bg-black/30" />
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="admin-alert admin-alert-error">
              Fix the FIFA Schedule JSON before using the fixture country editor.
            </div>
          )}
          <div className="admin-field">
            <label className="admin-label">FIFA Schedule Data JSON</label>
            <textarea
              name="fifaScheduleJson"
              value={formData.fifaScheduleJson}
              onChange={handleChange}
              className="admin-textarea"
              rows={20}
              spellCheck={false}
            />
          </div>
        </section>

        <section className="admin-panel space-y-5">
          <div className="space-y-2">
            <h3 className="font-display text-[18px] text-[#e8e9e9]">Rankings JSON</h3>
            <p className="admin-subtitle">
              Update Men and Women rankings using JSON. Required fields per row: rank, team, and points (code is optional).
            </p>
          </div>
          <div className="admin-field">
            <label className="admin-label">Rankings Data JSON</label>
            <textarea
              name="rankingsJson"
              value={formData.rankingsJson}
              onChange={handleChange}
              className="admin-textarea"
              rows={18}
              spellCheck={false}
            />
          </div>
        </section>

        <div className="admin-panel">
          <div className="admin-form-actions">
            <button type="submit" disabled={saving} className="admin-button admin-button-blue disabled:opacity-50">
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
