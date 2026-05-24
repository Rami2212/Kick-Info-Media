"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type RegisterFormProps = {
  googleEnabled: boolean;
};

export default function RegisterForm({ googleEnabled }: RegisterFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: "/profile",
      });

      if (signInResult?.error) {
        router.push("/login");
        return;
      }

      router.push(signInResult?.url || "/profile");
      router.refresh();
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleRegister() {
    setGoogleLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/profile" });
    } catch {
      setError("Google sign up failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="admin-kicker">Account</p>
        <h1 className="auth-title">Register</h1>
        <p className="auth-subtitle">Create your account to manage profile and interact as a user.</p>

        {error && <div className="admin-alert admin-alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="admin-field">
            <label className="admin-label" htmlFor="register-username">Username</label>
            <input
              id="register-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="admin-input"
              placeholder="football_fan"
            />
          </div>

          <div className="admin-field">
            <label className="admin-label" htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input"
              placeholder="you@email.com"
            />
          </div>

          <div className="admin-field">
            <label className="admin-label" htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div className="admin-field">
            <label className="admin-label" htmlFor="register-confirm-password">Confirm Password</label>
            <input
              id="register-confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="admin-input"
              placeholder="Repeat password"
            />
          </div>

          <button type="submit" disabled={loading} className="admin-button admin-button-blue w-full disabled:opacity-50">
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {googleEnabled && (
          <>
            <div className="auth-divider"><span>or</span></div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={googleLoading}
              className="admin-button admin-button-ghost w-full disabled:opacity-50"
            >
              {googleLoading ? "Redirecting..." : "Continue With Google"}
            </button>
          </>
        )}

        <p className="auth-foot">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
