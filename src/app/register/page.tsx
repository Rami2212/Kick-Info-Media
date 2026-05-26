import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/googleAuth";
import RegisterForm from "./RegisterForm";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Register | KickInfoMedia",
  description: "Create a KickInfoMedia account to join fan polls, bracket picks, and football updates.",
  keywords: mergeSeoKeywords(["register", "sign up", "football fan account"], SEO_DEFAULT_KEYWORDS),
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RegisterPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

function sanitizeCallbackUrl(input: string | undefined): string {
  if (!input) return "/profile";
  if (!input.startsWith("/")) return "/profile";
  if (input.startsWith("//")) return "/profile";
  return input;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);
  const session = await auth();
  if (session?.user?.id) {
    redirect(safeCallbackUrl);
  }

  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return <RegisterForm googleEnabled={googleEnabled} callbackUrl={safeCallbackUrl} />;
}
