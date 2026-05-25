"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AdminRichEditor from "../../components/AdminRichEditor";
import { TEAM_GROUPS } from "@/lib/teamGroups";

type Team = {
  id: string;
  group?: string;
  country?: string;
  description?: string;
  cover_image_url?: string;
  team_image_url?: string;
  image_url?: string; // legacy fallback
  published?: boolean;
};

type TeamFormData = {
  group: string;
  country: string;
  description: string;
  cover_image_url: string;
  team_image_url: string;
  published: boolean;
};

export default function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<TeamFormData>({
    group: TEAM_GROUPS[0],
    country: "",
    description: "",
    cover_image_url: "",
    team_image_url: "",
    published: false,
  });

  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await fetch(`/api/teams?id=${id}`);
        if (!res.ok) {
          throw new Error("Team not found");
        }

        const team = (await res.json()) as Team;
        setFormData({
          group:
            typeof team.group === "string" && TEAM_GROUPS.includes(team.group as (typeof TEAM_GROUPS)[number])
              ? (team.group as (typeof TEAM_GROUPS)[number])
              : TEAM_GROUPS[0],
          country: team.country || "",
          description: team.description || "",
          cover_image_url: team.cover_image_url || team.image_url || "",
          team_image_url: team.team_image_url || team.image_url || "",
          published: !!team.published,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load team");
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value,
    }));
  };

  const uploadTeamImage = async (
    file: File,
    target: "cover_image_url" | "team_image_url",
  ) => {
    setUploading(true);
    setError("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Image upload failed");
      }

      setFormData((prev) => ({ ...prev, [target]: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/teams?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update team");
      }

      router.push("/admin/teams");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update team");
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-white/40">Loading team...</div>;

  return (
    <div className="admin-page space-y-6">
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">Teams</p>
          <h2 className="admin-title mt-2">Edit Team</h2>
        </div>
        <Link href="/admin/teams" className="admin-button admin-button-ghost">
          Cancel
        </Link>
      </div>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="admin-panel space-y-6">
        <div className="admin-form-grid md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div className="admin-field">
              <label className="admin-label">Group</label>
              <select
                name="group"
                required
                value={formData.group}
                onChange={handleChange}
                className="admin-select"
              >
                {TEAM_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label className="admin-label">Country</label>
              <input
                type="text"
                name="country"
                required
                value={formData.country}
                onChange={handleChange}
                className="admin-input"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">Description</label>
              <AdminRichEditor
                value={formData.description}
                onChange={(description) => setFormData((prev) => ({ ...prev, description }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-md border border-white/10 bg-black/60 p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="published"
                  checked={formData.published}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#7fb525] border-white/30 rounded"
                />
                <span className="text-[#e8e9e9] font-heading text-[11px] uppercase tracking-[0.2em]">
                  Publish Team
                </span>
              </label>
              <p className="text-[10px] text-white/30 mt-2">
                If unchecked, this team is hidden on the public teams page.
              </p>
            </div>

            <div className="admin-field">
              <label className="admin-label">Cover Image URL</label>
              <input
                type="text"
                name="cover_image_url"
                value={formData.cover_image_url}
                onChange={handleChange}
                className="admin-input"
                placeholder="https://..."
              />
              <label className="admin-button admin-button-ghost mt-3 w-full cursor-pointer">
                {uploading ? "Uploading..." : "Upload Cover Image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadTeamImage(file, "cover_image_url");
                    e.target.value = "";
                  }}
                />
              </label>
              {formData.cover_image_url && (
                <Image
                  src={formData.cover_image_url}
                  alt="Cover preview"
                  width={640}
                  height={360}
                  className="mt-3 w-full rounded-md border border-white/10 object-cover"
                />
              )}
            </div>

            <div className="admin-field">
              <label className="admin-label">Team Image URL</label>
              <input
                type="text"
                name="team_image_url"
                value={formData.team_image_url}
                onChange={handleChange}
                className="admin-input"
                placeholder="https://..."
              />
              <label className="admin-button admin-button-ghost mt-3 w-full cursor-pointer">
                {uploading ? "Uploading..." : "Upload Team Image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadTeamImage(file, "team_image_url");
                    e.target.value = "";
                  }}
                />
              </label>
              {formData.team_image_url && (
                <Image
                  src={formData.team_image_url}
                  alt="Team image preview"
                  width={640}
                  height={360}
                  className="mt-3 w-full rounded-md border border-white/10 object-cover"
                />
              )}
            </div>
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" disabled={saving} className="admin-button admin-button-blue disabled:opacity-50">
            {saving ? "Saving..." : "Update Team"}
          </button>
        </div>
      </form>
    </div>
  );
}
