import { NextResponse } from "next/server";
import { enforceSameOrigin } from "@/lib/security";

const COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.csrf-token",
  "next-auth.csrf-token",
  "authjs.callback-url",
  "next-auth.callback-url",
];

export async function POST(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const res = NextResponse.json({ success: true });

  for (const name of COOKIE_NAMES) {
    res.cookies.set({
      name,
      value: "",
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: name.startsWith("__Secure-"),
    });
  }

  return res;
}

