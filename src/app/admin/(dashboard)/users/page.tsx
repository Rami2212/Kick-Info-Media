"use client";

import { useEffect, useMemo, useState } from "react";

type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  name: string;
  displayName: string;
  country: string;
  membership: string;
  createdAt: string;
  profileImageUrl: string;
};

function safeText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function safeDate(value: unknown) {
  if (typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    void fetchUsers();
  }, []);

  const userCount = useMemo(() => users.length, [users]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      if (!response.ok) {
        setUsers([]);
        return;
      }

      const data = (await response.json()) as unknown;
      setUsers(Array.isArray(data) ? (data as AdminUserRow[]) : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(id: string) {
    if (!id) return;
    if (!confirm("Delete this user? This action cannot be undone.")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete user.");
        return;
      }

      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch {
      alert("Failed to delete user.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="admin-page-wide space-y-6">
      <div className="admin-panel">
        <p className="admin-kicker">Accounts</p>
        <h2 className="admin-title mt-2">Users</h2>
        <p className="admin-subtitle">All registered users in your database. Total users: {userCount}</p>
      </div>

      <div className="admin-panel admin-table-wrap">
        {loading ? (
          <div className="p-8 text-center text-white/40">Loading users...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Name</th>
                <th>Country</th>
                <th>Membership</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={safeText(user.id) || safeText(user.email)}>
                  <td>
                    <div className="flex items-center gap-3">
                      {safeText(user.profileImageUrl) ? (
                        <img
                          src={safeText(user.profileImageUrl)}
                          alt={safeText(user.username)}
                          className="h-9 w-9 rounded-full border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-[11px] font-heading text-white/65">
                          {(safeText(user.username) || "U").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-heading text-[11px] uppercase tracking-[0.12em] text-white/85 truncate">
                          @{safeText(user.username) || "unknown"}
                        </p>
                        <p className="text-[11px] text-white/40 truncate">{safeText(user.id)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-white/75">{safeText(user.email)}</td>
                  <td>{safeText(user.name) || safeText(user.displayName) || "-"}</td>
                  <td>{safeText(user.country) || "-"}</td>
                  <td>{safeText(user.membership) || "-"}</td>
                  <td>{safeDate(user.createdAt) || "-"}</td>
                  <td className="text-right">
                    <div className="admin-action-group">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        className="admin-action-button admin-action-delete"
                        disabled={deletingId === user.id}
                      >
                        {deletingId === user.id ? "Deleting" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-white/45">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
