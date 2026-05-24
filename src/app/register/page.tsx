import { redirect } from "next/navigation";
import { auth } from "@/lib/googleAuth";
import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/profile");
  }

  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return <RegisterForm googleEnabled={googleEnabled} />;
}
