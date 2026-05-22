import { NextResponse } from "next/server";
import { createUserWithPassword, isValidUsername } from "@/lib/users";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required." }, { status: 400 });
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: "Username must be 2-20 chars (letters, numbers, underscore)." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const user = await createUserWithPassword({ username, email, password });
    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    if (message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

