import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/adminAuth";
import { createUserProfile, isValidUsername, updateAdminUserById } from "@/lib/users";
import { getMongoDb } from "@/lib/mongodb";

export const runtime = "nodejs";

async function ensureAdmin() {
  return requireAdminAuth();
}

type AdminUserDoc = {
  id?: string;
  username?: string;
  email?: string;
  name?: string;
  displayName?: string;
  country?: string;
  phone?: string;
  membership?: string;
  profileImageUrl?: string;
  createdAt?: string;
};

function toAdminUser(doc: AdminUserDoc) {
  return {
    id: typeof doc.id === "string" ? doc.id : "",
    username: typeof doc.username === "string" ? doc.username : "",
    email: typeof doc.email === "string" ? doc.email : "",
    name: typeof doc.name === "string" ? doc.name : "",
    displayName: typeof doc.displayName === "string" ? doc.displayName : "",
    country: typeof doc.country === "string" ? doc.country : "",
    phone: typeof doc.phone === "string" ? doc.phone : "",
    membership: typeof doc.membership === "string" ? doc.membership : "",
    profileImageUrl: typeof doc.profileImageUrl === "string" ? doc.profileImageUrl : "",
    createdAt: typeof doc.createdAt === "string" ? doc.createdAt : "",
  };
}

export async function GET() {
  const admin = await ensureAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getMongoDb();
  const users = await db
    .collection<AdminUserDoc>("users")
    .find(
      {},
      {
        projection: {
          _id: 0,
          id: 1,
          username: 1,
          email: 1,
          name: 1,
          displayName: 1,
          country: 1,
          phone: 1,
          membership: 1,
          createdAt: 1,
          profileImageUrl: 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .limit(2000)
    .toArray();

  return NextResponse.json(users.map((u) => toAdminUser(u)));
}

export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : undefined;

  if (!username || !email) {
    return NextResponse.json({ error: "Username and email are required" }, { status: 400 });
  }

  if (!isValidUsername(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    const user = await createUserProfile({
      username,
      email,
      password,
      name: typeof body.name === "string" ? body.name : undefined,
      profileImageUrl: typeof body.profileImageUrl === "string" ? body.profileImageUrl : undefined,
      country: typeof body.country === "string" ? body.country : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      membership: typeof body.membership === "string" ? body.membership : undefined,
    });

    return NextResponse.json(toAdminUser(user), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    const status = message.includes("already in use") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: Request) {
  const admin = await ensureAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || "").trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.username === "string" && !isValidUsername(body.username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    const updated = await updateAdminUserById(id, {
      username: typeof body.username === "string" ? body.username : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      password: typeof body.password === "string" ? body.password : undefined,
      name: typeof body.name === "string" ? body.name : undefined,
      profileImageUrl: typeof body.profileImageUrl === "string" ? body.profileImageUrl : undefined,
      country: typeof body.country === "string" ? body.country : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      membership: typeof body.membership === "string" ? body.membership : undefined,
    });

    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(toAdminUser(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    const status = message.includes("already in use") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request) {
  const admin = await ensureAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || "").trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = await getMongoDb();
  const result = await db.collection("users").deleteOne({ id });
  if (!result.deletedCount) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
