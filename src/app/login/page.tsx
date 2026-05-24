import { redirect } from "next/navigation";
import { auth } from "@/lib/googleAuth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/profile");
  }

  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return <LoginForm googleEnabled={googleEnabled} />;
}
