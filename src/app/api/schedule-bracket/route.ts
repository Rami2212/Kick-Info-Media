import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/adminAuth";
import {
  getScheduleBracketSettings,
  getScheduleGroupStageSettings,
  getSiteSettings,
  updateSiteSettings,
} from "@/lib/siteSettings";
import { parseScheduleBracketData } from "@/lib/scheduleBracket";
import { parseScheduleGroupStageData } from "@/lib/scheduleGroupStage";
import { enforceSameOrigin } from "@/lib/security";

type BracketPayload = {
  slots?: unknown;
  groups?: unknown;
};

export async function GET() {
  try {
    const settings = await getSiteSettings();
    const bracket = getScheduleBracketSettings(settings);
    const groupStage = getScheduleGroupStageSettings(settings);
    return NextResponse.json({ slots: bracket.slots, groups: groupStage.groups });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load bracket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const admin = await requireAdminAuth();
  if (!admin.ok) {
    return NextResponse.json({ error: "Only admins can edit bracket settings." }, { status: 401 });
  }

  let body: BracketPayload;
  try {
    body = (await req.json()) as BracketPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const settings = await getSiteSettings();
    const currentBracket = getScheduleBracketSettings(settings);
    const currentGroupStage = getScheduleGroupStageSettings(settings);

    let nextSlots = currentBracket.slots;
    let nextGroups = currentGroupStage.groups;

    if (body.slots !== undefined) {
      const parsedBracket = parseScheduleBracketData({ slots: body.slots });
      if (!parsedBracket) {
        return NextResponse.json({ error: "Invalid bracket payload" }, { status: 400 });
      }
      nextSlots = parsedBracket.slots;
    }

    if (body.groups !== undefined) {
      const parsedGroups = parseScheduleGroupStageData({ groups: body.groups });
      if (!parsedGroups) {
        return NextResponse.json({ error: "Invalid group stage payload" }, { status: 400 });
      }
      nextGroups = parsedGroups.groups;
    }

    const bracketJson = JSON.stringify({ slots: nextSlots }, null, 2);
    const groupStageJson = JSON.stringify({ groups: nextGroups }, null, 2);

    await updateSiteSettings({
      extra: {
        scheduleBracketJson: bracketJson,
        scheduleGroupStageJson: groupStageJson,
      },
    });

    return NextResponse.json({ slots: nextSlots, groups: nextGroups, saved: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save bracket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
