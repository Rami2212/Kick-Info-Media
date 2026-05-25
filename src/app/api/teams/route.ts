import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/adminAuth";
import {
  createTeam,
  deleteTeam,
  getTeamById,
  listTeams,
  updateTeam,
} from "@/lib/teams";
import { TEAM_GROUPS } from "@/lib/teamGroups";
import { enforceSameOrigin, sanitizeRichHtml } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const all = searchParams.get("all");
  const includeUnpublished = !!all;

  if (includeUnpublished) {
    const admin = await requireAdminAuth();
    if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (id) {
    const admin = await requireAdminAuth();
    if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const team = await getTeamById(id);
    if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(team);
  }

  const teams = await listTeams({ publishedOnly: !includeUnpublished });
  return NextResponse.json(teams);
}

export async function POST(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const admin = await requireAdminAuth();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    group,
    country,
    description,
    cover_image_url,
    team_image_url,
    published,
  } = body;

  const safeCountry = typeof country === "string" ? country.trim().slice(0, 120) : "";
  const safeDescription = typeof description === "string" ? sanitizeRichHtml(description) : "";

  if (!group || !TEAM_GROUPS.includes(group) || !safeCountry || !safeDescription) {
    return NextResponse.json(
      { error: "Group, country, and description are required." },
      { status: 400 },
    );
  }

  const team = await createTeam({
    group,
    country: safeCountry,
    description: safeDescription,
    cover_image_url,
    team_image_url,
    published: !!published,
  });

  return NextResponse.json(team, { status: 201 });
}

export async function PUT(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const admin = await requireAdminAuth();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const body = await req.json();
  const {
    group,
    country,
    description,
    cover_image_url,
    team_image_url,
    published,
  } = body;

  const safeCountry = typeof country === "string" ? country.trim().slice(0, 120) : "";
  const safeDescription = typeof description === "string" ? sanitizeRichHtml(description) : "";

  if (!group || !TEAM_GROUPS.includes(group) || !safeCountry || !safeDescription) {
    return NextResponse.json(
      { error: "Group, country, and description are required." },
      { status: 400 },
    );
  }

  const team = await updateTeam(id, {
    group,
    country: safeCountry,
    description: safeDescription,
    cover_image_url,
    team_image_url,
    published: !!published,
  });

  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(team);
}

export async function DELETE(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const admin = await requireAdminAuth();
  if (!admin.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const deleted = await deleteTeam(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
