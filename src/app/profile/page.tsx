import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/googleAuth";
import ProfileForm from "./ProfileForm";
import { SEO_DEFAULT_KEYWORDS, mergeSeoKeywords } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Profile | KickInfoMedia",
  description: "Manage your KickInfoMedia profile and account preferences.",
  keywords: mergeSeoKeywords(["profile", "account settings", "football user profile"], SEO_DEFAULT_KEYWORDS),
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return <ProfileForm />;
}
