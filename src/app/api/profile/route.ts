import { NextResponse } from "next/server";
import { auth } from "@/lib/googleAuth";
import { getUserById, toPublicProfile, updateUserProfileById } from "@/lib/users";

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
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updated = await updateUserProfileById(userId, {
    firstName: typeof body?.firstName === "string" ? body.firstName : undefined,
    lastName: typeof body?.lastName === "string" ? body.lastName : undefined,
    bio: typeof body?.bio === "string" ? body.bio : undefined,
    birthday: typeof body?.birthday === "string" ? body.birthday : undefined,
    gender: typeof body?.gender === "string" ? body.gender : undefined,
  });

  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(toPublicProfile(updated));
}

