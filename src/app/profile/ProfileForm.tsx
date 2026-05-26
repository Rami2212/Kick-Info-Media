"use client";

import { FormEvent, useEffect, useState } from "react";
import { CompactAdSlot } from "@/app/components/ads/Ads";

type ProfilePayload = {
  username: string;
  email: string;
  displayName?: string;
  firstName: string;
  lastName: string;
  bio: string;
  birthday: string;
  gender: string;
  profileImageUrl: string;
};

export default function ProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<ProfilePayload>({
    username: "",
    email: "",
    displayName: "",
    firstName: "",
    lastName: "",
    bio: "",
    birthday: "",
    gender: "",
    profileImageUrl: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const data = (await response.json()) as Partial<ProfilePayload> & { error?: string };
        if (!response.ok) {
          throw new Error(data.error || "Failed to load profile");
        }
        setFormData((prev) => ({
          ...prev,
          username: data.username || "",
          email: data.email || "",
          displayName: data.displayName || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          bio: data.bio || "",
          birthday: data.birthday || "",
          gender: data.gender || "",
          profileImageUrl: data.profileImageUrl || "",
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          bio: formData.bio,
          birthday: formData.birthday,
          gender: formData.gender,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    setAvatarUploading(true);
    setSuccess("");
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as { error?: string; profileImageUrl?: string };
      if (!response.ok || !data.profileImageUrl) {
        throw new Error(data.error || "Avatar upload failed");
      }
      setFormData((prev) => ({ ...prev, profileImageUrl: data.profileImageUrl || "" }));
      setSuccess("Profile image updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Avatar upload failed");
    } finally {
      setAvatarUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="empty-state-desc">Loading profile...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card profile-card">
        <p className="admin-kicker">Account</p>
        <h1 className="auth-title">My Profile</h1>
        <p className="auth-subtitle">Manage your account details and profile image.</p>

        {success && <div className="admin-alert admin-alert-success">{success}</div>}
        {error && <div className="admin-alert admin-alert-error">{error}</div>}

        <div className="profile-header">
          <div className="profile-avatar-wrap">
            {formData.profileImageUrl ? (
              <img src={formData.profileImageUrl} alt="Profile avatar" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-fallback">{(formData.username || "U").slice(0, 1).toUpperCase()}</div>
            )}
          </div>
          <div className="profile-header-meta">
            <p className="profile-username">@{formData.username}</p>
            <p className="profile-email">{formData.email}</p>
            <label className="admin-button admin-button-ghost cursor-pointer">
              {avatarUploading ? "Uploading..." : "Upload Profile Image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAvatar(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="profile-grid">
            <div className="admin-field">
              <label className="admin-label" htmlFor="firstName">First Name</label>
              <input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className="admin-input" />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="lastName">Last Name</label>
              <input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className="admin-input" />
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-label" htmlFor="bio">Bio</label>
            <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} className="admin-textarea" rows={4} />
          </div>

          <div className="profile-grid">
            <div className="admin-field">
              <label className="admin-label" htmlFor="birthday">Birthday</label>
              <input id="birthday" name="birthday" type="date" value={formData.birthday} onChange={handleChange} className="admin-input" />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="gender">Gender</label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className="admin-select">
                <option value="">Not set</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={saving} className="admin-button admin-button-blue">
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <div className="ad-compact-slot" style={{ marginTop: "14px" }}>
          <CompactAdSlot size="300x250" />
        </div>
      </section>
    </main>
  );
}
