"use client";

import { useEffect, useState } from "react";
import { DEFAULT_RANKINGS_JSON, parseRankingsJsonText } from "@/lib/rankings";
import {
  DEFAULT_SCHEDULE_BRACKET_JSON,
  parseScheduleBracketJsonText,
} from "@/lib/scheduleBracket";
import {
  DEFAULT_SCHEDULE_GROUP_STAGE_JSON,
  parseScheduleGroupStageJsonText,
} from "@/lib/scheduleGroupStage";

type BlogOption = {
  id: string;
  title: string;
  published: boolean;
};

type SettingsFormData = {
  topBarText: string;
  topBarItemsText: string;
  liveEmbedCodePrimary: string;
  liveEmbedCodeSecondary: string;
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

export default function SiteSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<BlogOption[]>([]);

  const [formData, setFormData] = useState<SettingsFormData>({
    topBarText: "",
    topBarItemsText: "",
    liveEmbedCodePrimary: "",
    liveEmbedCodeSecondary: "",
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
            liveEmbedCodePrimary:
              normalizeText(data.extra?.liveEmbedCodePrimary) ||
              normalizeText(data.extra?.liveEmbedCode),
            liveEmbedCodeSecondary: normalizeText(data.extra?.liveEmbedCodeSecondary),
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

      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extra: {
            topBarText: formData.topBarText,
            topBarItems: parseTopBarItems(formData.topBarItemsText),
            liveEmbedCode: formData.liveEmbedCodePrimary.trim(),
            liveEmbedCodePrimary: formData.liveEmbedCodePrimary.trim(),
            liveEmbedCodeSecondary: formData.liveEmbedCodeSecondary.trim(),
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
    <div className="admin-page space-y-6">
      <div className="admin-panel">
        <p className="admin-kicker">Configuration</p>
        <h2 className="admin-title mt-2">Site Settings</h2>
        <p className="admin-subtitle">Manage top bar text, live stream embeds, ads toggles, homepage blog placement, fan poll teams, schedule group JSON, schedule bracket JSON, and rankings JSON.</p>
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

      <form onSubmit={handleSubmit} className="admin-panel space-y-6">
        <div className="space-y-4">
          <h3 className="font-display text-[18px] text-[#e8e9e9] border-b border-white/10 pb-2">Top Bar Configuration</h3>

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
        </div>

        <div className="border-t border-white/10 pt-6 space-y-4">
          <h3 className="font-display text-[18px] text-[#e8e9e9]">Live Stream Configuration</h3>
          <p className="admin-subtitle !mt-0">
            Add one URL or iframe embed per screen. Live page shows Stream 1 first and Stream 2 underneath.
          </p>
          <div className="admin-field">
            <label className="admin-label">Live Stream 1 Embed Code or URL</label>
            <textarea
              name="liveEmbedCodePrimary"
              value={formData.liveEmbedCodePrimary}
              onChange={handleChange}
              className="admin-textarea"
              rows={6}
              spellCheck={false}
              placeholder={"https://embedsports.me/segunda-division/cadiz-vs-leganes-stream-1\nor\n<iframe src='https://embedsports.me/...'></iframe>"}
            />
          </div>
          <div className="admin-field">
            <label className="admin-label">Live Stream 2 Embed Code or URL</label>
            <textarea
              name="liveEmbedCodeSecondary"
              value={formData.liveEmbedCodeSecondary}
              onChange={handleChange}
              className="admin-textarea"
              rows={6}
              spellCheck={false}
              placeholder={"https://embedsports.me/segunda-division/cultural-leonesa-vs-burgos-stream-1\nor\n<iframe src='https://embedsports.me/...'></iframe>"}
            />
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 space-y-4">
          <h3 className="font-display text-[18px] text-[#e8e9e9]">Ads Configuration</h3>
          <p className="admin-subtitle !mt-0">
            Popunder and Social Bar scripts can be enabled or disabled globally from here.
          </p>
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
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="font-display text-[18px] text-[#e8e9e9] mb-4">Homepage Blog Placement</h3>

          <div className="admin-form-grid-2">
            <div className="space-y-4">
              <p className="font-heading text-[10px] uppercase tracking-[0.22em] text-[#7fb525]">Hero Section</p>
              {[0, 1, 2, 3].map((index) => (
                <div key={`hero-${index}`} className="admin-field">
                  <label className="admin-label">Hero Place {index + 1}</label>
                  {renderPostSelect("heroPostIds", index)}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <p className="font-heading text-[10px] uppercase tracking-[0.22em] text-[#1877c1]">Top Stories</p>
              {[0, 1, 2, 3].map((index) => (
                <div key={`top-story-${index}`} className="admin-field">
                  <label className="admin-label">Top Story Place {index + 1}</label>
                  {renderPostSelect("topStoryPostIds", index)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 space-y-4">
          <h3 className="font-display text-[18px] text-[#e8e9e9]">Next Match Poll</h3>
          <p className="admin-subtitle !mt-0">
            Set two countries for the next match. Both country names and votes are stored in MongoDB.
          </p>

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
            <div className="space-y-4">
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
                <label className="admin-label">Flag URL (CDN Link)</label>
                <input
                  type="text"
                  name="nextMatchTeamAFlagImageUrl"
                  value={formData.nextMatchTeamAFlagImageUrl}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="https://flagcdn.com/w160/ua.png"
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

            <div className="space-y-4">
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
                <label className="admin-label">Flag URL (CDN Link)</label>
                <input
                  type="text"
                  name="nextMatchTeamBFlagImageUrl"
                  value={formData.nextMatchTeamBFlagImageUrl}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="https://flagcdn.com/w160/fr.png"
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
        </div>

        <div className="border-t border-white/10 pt-6 space-y-4">
          <h3 className="font-display text-[18px] text-[#e8e9e9]">Schedule Group Stage JSON</h3>
          <p className="admin-subtitle !mt-0">
            Controls the group-stage board above the /fifa-game bracket. Keep 12 groups with 4 teams each.
          </p>
          <div className="admin-field">
            <label className="admin-label">Schedule Group Stage Data JSON</label>
            <textarea
              name="scheduleGroupStageJson"
              value={formData.scheduleGroupStageJson}
              onChange={handleChange}
              className="admin-textarea"
              rows={20}
              spellCheck={false}
            />
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 space-y-4">
          <h3 className="font-display text-[18px] text-[#e8e9e9]">Schedule Bracket JSON</h3>
          <p className="admin-subtitle !mt-0">
            Controls the /fifa-game page bracket. Edit slot IDs #1 to #64 with code (1A, W74...), country name, and flag URL.
          </p>
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
        </div>

        <div className="border-t border-white/10 pt-6 space-y-4">
          <h3 className="font-display text-[18px] text-[#e8e9e9]">Rankings JSON</h3>
          <p className="admin-subtitle !mt-0">
            Update Men and Women rankings using JSON. Required fields per row: rank, team, and points (code is optional).
          </p>
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
        </div>

        <div className="admin-form-actions">
          <button type="submit" disabled={saving} className="admin-button admin-button-blue disabled:opacity-50">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
