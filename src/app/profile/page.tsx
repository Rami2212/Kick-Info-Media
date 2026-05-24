import { redirect } from "next/navigation";
import { auth } from "@/lib/googleAuth";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return <ProfileForm />;
}
