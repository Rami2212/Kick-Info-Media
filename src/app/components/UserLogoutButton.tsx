"use client";

import { useState } from "react";

type UserLogoutButtonProps = {
  className?: string;
  label?: string;
};

export default function UserLogoutButton({ className = "nav-auth-link", label = "Logout" }: UserLogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);

    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className}
      disabled={loading}
    >
      {loading ? "Signing Out..." : label}
    </button>
  );
}
