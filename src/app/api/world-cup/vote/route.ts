import { NextResponse } from "next/server";
import { getNextMatchSettings, getSiteSettings, getWorldCupSettings, incrementWorldCupVote } from "@/lib/siteSettings";

type VotePayload = {
  matchId?: unknown;
  side?: unknown;
};

function parsePayload(payload: VotePayload): { matchId: string; side: "a" | "b" } | null {
  if (typeof payload.matchId !== "string") return null;
  const matchId = payload.matchId.trim();
  if (!matchId) return null;
  if (payload.side !== "a" && payload.side !== "b") return null;
  return { matchId, side: payload.side };
}

export async function POST(req: Request) {
  let body: VotePayload;
  try {
    body = (await req.json()) as VotePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = parsePayload(body);
  if (!payload) {
    return NextResponse.json({ error: "Invalid vote payload" }, { status: 400 });
  }

  try {
    const settings = await getSiteSettings();
    const game = getWorldCupSettings(settings);
    const nextMatch = getNextMatchSettings(settings);

    const isNextMatchVote =
      payload.matchId === nextMatch.matchId &&
      nextMatch.hasTeams;

    if (!isNextMatchVote) {
      const selectedMatch = game.graph.matches.find((match) => match.id === payload.matchId);
      if (!selectedMatch || !selectedMatch.canVote) {
        return NextResponse.json(
          { error: "Match not found or voting is closed for this match" },
          { status: 400 },
        );
      }
    }

    await incrementWorldCupVote(payload.matchId, payload.side);
    const updated = getWorldCupSettings(await getSiteSettings());

    return NextResponse.json({
      matchId: payload.matchId,
      side: payload.side,
      votes: updated.votes,
      graph: updated.graph,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit vote";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
