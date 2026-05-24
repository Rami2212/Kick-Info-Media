import { auth } from "@/lib/googleAuth";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;

  return <NavbarClient loggedIn={loggedIn} />;
}
