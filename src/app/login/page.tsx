import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/googleAuth";
import LoginForm from "./LoginForm";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Login | KickInfoMedia",
  description: "Login to access your KickInfoMedia profile, picks, and live football features.",
  keywords: mergeSeoKeywords(["login", "user account", "football picks"], SEO_DEFAULT_KEYWORDS),
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

function sanitizeCallbackUrl(input: string | undefined): string {
  if (!input) return "/profile";
  if (!input.startsWith("/")) return "/profile";
  if (input.startsWith("//")) return "/profile";
  return input;
}

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);
  const session = await auth();
  if (session?.user?.id) {
    redirect(safeCallbackUrl);
  }

  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return <LoginForm googleEnabled={googleEnabled} />;
}
