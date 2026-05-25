"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

type LoginFormProps = {
  googleEnabled: boolean;
};

function sanitizeCallbackUrl(input: string | null): string {
  if (!input) return "/profile";
  if (!input.startsWith("/")) return "/profile";
  if (input.startsWith("//")) return "/profile";
  return input;
}

export default function LoginForm({ googleEnabled }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const authErrorCode = searchParams.get("error");
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));
  const authErrorMessage =
    authErrorCode === "Configuration"
      ? "Login is not configured on server yet. Add AUTH_SECRET (or NEXTAUTH_SECRET), NEXTAUTH_URL/AUTH_URL, and redeploy."
      : authErrorCode
        ? "Login failed. Please try again."
        : "";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push(result?.url || callbackUrl);
      router.refresh();
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError("Google login failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="admin-kicker">Account</p>
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Sign in with your email/password or continue with Google.</p>

        {(error || authErrorMessage) && (
          <div className="admin-alert admin-alert-error">{error || authErrorMessage}</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="admin-field">
            <label className="admin-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input"
              placeholder="you@email.com"
            />
          </div>

          <div className="admin-field">
            <label className="admin-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
              placeholder="********"
            />
          </div>

          <button type="submit" disabled={loading} className="admin-button admin-button-blue w-full disabled:opacity-50">
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {googleEnabled && (
          <>
            <div className="auth-divider"><span>or</span></div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="admin-button admin-button-ghost w-full disabled:opacity-50"
            >
              {googleLoading ? "Redirecting..." : "Continue With Google"}
            </button>
          </>
        )}

        <p className="auth-foot">
          Don&apos;t have an account? <Link href="/register">Create one</Link>
        </p>
      </section>
    </main>
  );
}
