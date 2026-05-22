import { requireAdminAuth } from "@/lib/adminAuth";
import { getSiteSettings, updateSiteSettings, type CoverPageSettings, type SiteSettings } from "@/lib/siteSettings";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseCoverPage(payload: Record<string, unknown>): Partial<CoverPageSettings> | null {
  const input = payload.coverPage;
  if (!input || typeof input !== "object") return null;
  const cover = input as Record<string, unknown>;
  const next: Partial<CoverPageSettings> = {};

  if (typeof cover.title === "string") next.title = cover.title;
  if (typeof cover.subtitle === "string") next.subtitle = cover.subtitle;
  if (typeof cover.image_url === "string") next.image_url = cover.image_url;
  if (typeof cover.video_url === "string") next.video_url = cover.video_url;
  if (typeof cover.cta_label === "string") next.cta_label = cover.cta_label;
  if (typeof cover.cta_url === "string") next.cta_url = cover.cta_url;

  return Object.keys(next).length ? next : null;
}

function parseExtra(payload: Record<string, unknown>): Record<string, unknown> | null {
  if (!payload.extra || typeof payload.extra !== "object") return null;
  const extra = payload.extra as Record<string, unknown>;
  return Object.keys(extra).length ? extra : null;
}

export async function PUT(req: Request) {
  const admin = await requireAdminAuth();

  if (!admin.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const coverPage = parseCoverPage(body);
  const extra = parseExtra(body);

  if (!coverPage && !extra) {
    return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });
  }

  try {
    const settings: SiteSettings = await updateSiteSettings({
      coverPage: coverPage || undefined,
      extra: extra || undefined,
    });
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
