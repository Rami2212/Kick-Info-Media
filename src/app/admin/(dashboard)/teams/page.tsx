"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Team = {
  id: string;
  group: string;
  country: string;
  description: string;
  cover_image_url: string;
  team_image_url: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const res = await fetch("/api/teams?all=true");
      if (res.ok) {
        const data = await res.json();
        setTeams(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load teams", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      const res = await fetch(`/api/teams?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to delete team.");
        return;
      }
      setTeams((prev) => prev.filter((team) => team.id !== id));
    } catch {
      alert("Error deleting team.");
    }
  }

  return (
    <div className="admin-page-wide">
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">Teams</p>
          <h2 className="admin-title mt-2">Manage Teams</h2>
        </div>
        <Link href="/admin/teams/new" className="admin-button admin-button-blue">
          Add Team
        </Link>
      </div>

      <div className="admin-panel p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40">Loading teams...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Country</th>
                  <th scope="col">Group</th>
                  <th scope="col">Description</th>
                  <th scope="col">Status</th>
                  <th scope="col">Updated</th>
                  <th scope="col" className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-[#050505] divide-y divide-white/10">
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-black/40 transition-colors">
                    <td className="px-6 py-4 text-[12px] font-heading text-[#e8e9e9]/85">{team.country}</td>
                    <td className="px-6 py-4 text-[11px] text-white/65">{team.group}</td>
                    <td className="px-6 py-4 text-[10px] text-white/30 line-clamp-1">
                      {team.description.replace(/<[^>]+>/g, " ").trim() || "No description"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`admin-badge ${
                          team.published ? "bg-[#7fb525] text-black" : "bg-[#1877c1] text-white"
                        }`}
                      >
                        {team.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-white/35">
                      {new Date(team.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="admin-action-group">
                        <Link href={`/admin/teams/${team.id}`} className="admin-action-button admin-action-edit">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(team.id)}
                          className="admin-action-button admin-action-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {teams.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-white/40">
                      No teams yet.{" "}
                      <Link href="/admin/teams/new" className="text-[#7fb525] hover:text-white">
                        Create your first team
                      </Link>
                      .
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
