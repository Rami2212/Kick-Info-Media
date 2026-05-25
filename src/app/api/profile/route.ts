import { NextResponse } from "next/server";
import { auth } from "@/lib/googleAuth";
import { getUserById, toPublicProfile, updateUserProfileById } from "@/lib/users";
import { enforceSameOrigin } from "@/lib/security";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    ...toPublicProfile(user),
    email: user.email,
    displayName: user.displayName,
  });
}

export async function PUT(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim().slice(0, 60) : undefined;
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim().slice(0, 60) : undefined;
  const bio = typeof body?.bio === "string" ? body.bio.trim().slice(0, 1200) : undefined;
  const birthday = typeof body?.birthday === "string" ? body.birthday : undefined;
  const gender = typeof body?.gender === "string" ? body.gender : undefined;

  if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    return NextResponse.json({ error: "Invalid birthday format" }, { status: 400 });
  }
  if (gender && !["male", "female", "other", ""].includes(gender)) {
    return NextResponse.json({ error: "Invalid gender value" }, { status: 400 });
  }

  const updated = await updateUserProfileById(userId, {
    firstName,
    lastName,
    bio,
    birthday,
    gender,
  });

  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(toPublicProfile(updated));
}

