"use client";

import { useEffect, useState } from "react";

type BlogOption = {
  id: string;
  title: string;
  published: boolean;
};

type SettingsFormData = {
  topBarText: string;
  topBarItemsText: string;
  heroPostIds: string[];
  topStoryPostIds: string[];
  nextMatchId: string;
  nextMatchTeamAName: string;
  nextMatchTeamAFlagImageUrl: string;
  nextMatchTeamBName: string;
  nextMatchTeamBFlagImageUrl: string;
};

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

function getImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      reject(new Error("Failed to read image size"));
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  });
}

export default function SiteSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<BlogOption[]>([]);
  const [uploadingTeam, setUploadingTeam] = useState<"a" | "b" | null>(null);

  const [formData, setFormData] = useState<SettingsFormData>({
    topBarText: "",
    topBarItemsText: "",
    heroPostIds: ["", "", "", ""],
    topStoryPostIds: ["", "", "", ""],
    nextMatchId: "M1",
    nextMatchTeamAName: "",
    nextMatchTeamAFlagImageUrl: "",
    nextMatchTeamBName: "",
    nextMatchTeamBFlagImageUrl: "",
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
            heroPostIds: normalizePostIds(data.extra?.heroPostIds),
            topStoryPostIds: normalizePostIds(data.extra?.topStoryPostIds),
            nextMatchId: normalizeText(data.extra?.nextMatchId) || "M1",
            nextMatchTeamAName: normalizeText(data.extra?.nextMatchTeamAName),
            nextMatchTeamAFlagImageUrl: normalizeText(data.extra?.nextMatchTeamAFlagImageUrl),
            nextMatchTeamBName: normalizeText(data.extra?.nextMatchTeamBName),
            nextMatchTeamBFlagImageUrl: normalizeText(data.extra?.nextMatchTeamBFlagImageUrl),
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

  const handlePostSelection = (group: "heroPostIds" | "topStoryPostIds", index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [group]: prev[group].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const uploadFlag = async (team: "a" | "b", file: File) => {
    setUploadingTeam(team);
    setError("");

    try {
      if (file.type !== "image/png") {
        throw new Error("Please upload a PNG image for the country flag.");
      }

      const size = await getImageSize(file);
      if (size.width !== 50 || size.height !== 50) {
        throw new Error("Flag image size must be exactly 50x50.");
      }

      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Flag upload failed");
      }

      if (team === "a") {
        setFormData((prev) => ({ ...prev, nextMatchTeamAFlagImageUrl: data.url }));
      } else {
        setFormData((prev) => ({ ...prev, nextMatchTeamBFlagImageUrl: data.url }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Flag upload failed");
    } finally {
      setUploadingTeam(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extra: {
            topBarText: formData.topBarText,
            topBarItems: parseTopBarItems(formData.topBarItemsText),
            heroPostIds: formData.heroPostIds,
            topStoryPostIds: formData.topStoryPostIds,
            nextMatchId: formData.nextMatchId.trim() || "M1",
            nextMatchTeamAName: formData.nextMatchTeamAName.trim(),
            nextMatchTeamAFlagImageUrl: formData.nextMatchTeamAFlagImageUrl.trim(),
            nextMatchTeamBName: formData.nextMatchTeamBName.trim(),
            nextMatchTeamBFlagImageUrl: formData.nextMatchTeamBFlagImageUrl.trim(),
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
        <p className="admin-subtitle">Manage top bar text, homepage blog placement, and next-match poll teams.</p>
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
                <label className="admin-label">Flag URL (50x50 PNG)</label>
                <input
                  type="text"
                  name="nextMatchTeamAFlagImageUrl"
                  value={formData.nextMatchTeamAFlagImageUrl}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="https://..."
                />
                <label className="admin-button admin-button-ghost mt-1 w-full cursor-pointer">
                  {uploadingTeam === "a" ? "Uploading..." : "Upload 50x50 PNG"}
                  <input
                    type="file"
                    accept="image/png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFlag("a", file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {formData.nextMatchTeamAFlagImageUrl && (
                  <img
                    src={formData.nextMatchTeamAFlagImageUrl}
                    alt="Team A flag preview"
                    className="mt-2 h-[50px] w-[50px] rounded border border-white/10 object-cover"
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
                <label className="admin-label">Flag URL (50x50 PNG)</label>
                <input
                  type="text"
                  name="nextMatchTeamBFlagImageUrl"
                  value={formData.nextMatchTeamBFlagImageUrl}
                  onChange={handleChange}
                  className="admin-input"
                  placeholder="https://..."
                />
                <label className="admin-button admin-button-ghost mt-1 w-full cursor-pointer">
                  {uploadingTeam === "b" ? "Uploading..." : "Upload 50x50 PNG"}
                  <input
                    type="file"
                    accept="image/png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFlag("b", file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {formData.nextMatchTeamBFlagImageUrl && (
                  <img
                    src={formData.nextMatchTeamBFlagImageUrl}
                    alt="Team B flag preview"
                    className="mt-2 h-[50px] w-[50px] rounded border border-white/10 object-cover"
                  />
                )}
              </div>
            </div>
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
