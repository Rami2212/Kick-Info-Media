import { NextResponse } from "next/server";
import { auth } from "@/lib/googleAuth";
import {
  getScheduleBracketSettings,
  getScheduleGroupStageSettings,
  getSiteSettings,
} from "@/lib/siteSettings";
import { parseScheduleBracketData, resetScheduleBracketUserPicks } from "@/lib/scheduleBracket";
import { parseScheduleGroupStageData } from "@/lib/scheduleGroupStage";
import { checkRateLimit, enforceSameOrigin } from "@/lib/security";
import { getUserScheduleGame, upsertUserScheduleGame } from "@/lib/userScheduleGame";

type BracketPayload = {
  slots?: unknown;
  groups?: unknown;
};

export async function GET() {
  try {
    const [session, settings] = await Promise.all([auth(), getSiteSettings()]);
    const bracket = getScheduleBracketSettings(settings);
    const groupStage = getScheduleGroupStageSettings(settings);

    const userId = session?.user?.id ? String(session.user.id) : "";
    if (userId) {
      const userGame = await getUserScheduleGame(userId);
      if (userGame) {
        return NextResponse.json({
          slots: userGame.slots,
          groups: userGame.groups,
          source: "user",
        });
      }
    }

    return NextResponse.json({
      slots: resetScheduleBracketUserPicks(bracket.slots),
      groups: groupStage.groups,
      source: "default",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load bracket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  const rateLimit = checkRateLimit(req, "user-schedule-save", 20, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many save attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const session = await auth();
  const userId = session?.user?.id ? String(session.user.id) : "";
  if (!userId) {
    return NextResponse.json({ error: "Please login to save your game." }, { status: 401 });
  }

  let body: BracketPayload;
  try {
    body = (await req.json()) as BracketPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const parsedBracket = parseScheduleBracketData({ slots: body.slots });
    if (!parsedBracket) {
      return NextResponse.json({ error: "Invalid bracket payload" }, { status: 400 });
    }

    const parsedGroups = parseScheduleGroupStageData({ groups: body.groups });
    if (!parsedGroups) {
      return NextResponse.json({ error: "Invalid group stage payload" }, { status: 400 });
    }

    const savedGame = await upsertUserScheduleGame({
      userId,
      slots: parsedBracket.slots,
      groups: parsedGroups.groups,
    });

    return NextResponse.json({ ...savedGame, saved: true, source: "user" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save bracket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
