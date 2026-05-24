"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseWorldCupVotes, type WorldCupVotes } from "@/lib/worldCupGame";

type Team = {
  name: string;
  flagImageUrl: string;
};

type StoredVote = {
  side: "a" | "b";
  votedAt: string;
};

type StoredVotesMap = Record<string, StoredVote>;

type WorldCupBracketGameProps = {
  matchId: string;
  teamA: Team;
  teamB: Team;
  initialVotes: WorldCupVotes;
  requireAuth?: boolean;
  isLoggedIn?: boolean;
  loginPath?: string;
  compact?: boolean;
};

function getPercent(votes: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((votes / total) * 100);
}

const VOTE_STORAGE_KEY = "kickinfomedia_fan_poll_votes_v1";

function readStoredVotes(): StoredVotesMap {
  try {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(VOTE_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as StoredVotesMap;
  } catch {
    return {};
  }
}

function writeStoredVote(matchId: string, side: "a" | "b") {
  try {
    if (typeof window === "undefined") return;
    const votes = readStoredVotes();
    votes[matchId] = {
      side,
      votedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(votes));
  } catch {
    // Ignore storage write failures and keep UI responsive.
  }
}

export default function WorldCupBracketGame({
  matchId,
  teamA,
  teamB,
  initialVotes,
  requireAuth = false,
  isLoggedIn = true,
  loginPath = "/login",
  compact = false,
}: WorldCupBracketGameProps) {
  const router = useRouter();
  const [votes, setVotes] = useState<WorldCupVotes>(initialVotes || {});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [votedSide, setVotedSide] = useState<"a" | "b" | null>(null);

  const currentVotes = useMemo(() => {
    const parsed = parseWorldCupVotes(votes);
    return parsed[matchId] || { a: 0, b: 0 };
  }, [votes, matchId]);

  const totalVotes = currentVotes.a + currentVotes.b;
  const percentA = getPercent(currentVotes.a, totalVotes);
  const percentB = getPercent(currentVotes.b, totalVotes);

  const teamAName = teamA.name.trim();
  const teamBName = teamB.name.trim();
  const hasTeams = teamAName.length > 0 && teamBName.length > 0;
  const hasVoted = votedSide === "a" || votedSide === "b";

  useEffect(() => {
    const existing = readStoredVotes()[matchId];
    if (existing?.side === "a" || existing?.side === "b") {
      setVotedSide(existing.side);
      return;
    }
    setVotedSide(null);
  }, [matchId]);

  async function submitVote(side: "a" | "b") {
    if (!hasTeams || !matchId || submitting) return;
    const storedSide = readStoredVotes()[matchId]?.side;
    if (storedSide === "a" || storedSide === "b") {
      setVotedSide(storedSide);
      setError("You can vote only once in this fan poll.");
      return;
    }
    if (hasVoted) {
      setError("You can vote only once in this fan poll.");
      return;
    }
    if (requireAuth && !isLoggedIn) {
      router.push(loginPath);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/world-cup/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, side }),
      });

      const data = (await res.json()) as { error?: string; votes?: WorldCupVotes };
      if (res.status === 401) {
        router.push(loginPath);
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Vote submission failed");
      }

      if (data.votes && typeof data.votes === "object") {
        setVotes(parseWorldCupVotes(data.votes));
      }
      writeStoredVote(matchId, side);
      setVotedSide(side);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit your vote");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasTeams) {
    return (
      <div className="world-cup-empty">
        <p className="empty-state-desc">Set Team A and Team B in Site Settings to show the next match.</p>
      </div>
    );
  }

  return (
    <div className={`next-match-wrap${compact ? " next-match-wrap-compact" : ""}`}>
      <div className="next-match-grid">
        <button
          type="button"
          className={`next-team-card${hasVoted ? " locked" : ""}${votedSide === "a" ? " voted" : ""}`}
          onClick={() => submitVote("a")}
          disabled={submitting || hasVoted}
        >
          {teamA.flagImageUrl ? (
            <img src={teamA.flagImageUrl} alt={`${teamAName} flag`} className="next-team-flag" />
          ) : (
            <div className="next-team-flag next-team-flag-empty">No Flag</div>
          )}
          <p className="next-team-name">{teamAName}</p>
          <p className="next-team-votes">{percentA}%</p>
        </button>

        <button
          type="button"
          className={`next-team-card${hasVoted ? " locked" : ""}${votedSide === "b" ? " voted" : ""}`}
          onClick={() => submitVote("b")}
          disabled={submitting || hasVoted}
        >
          {teamB.flagImageUrl ? (
            <img src={teamB.flagImageUrl} alt={`${teamBName} flag`} className="next-team-flag" />
          ) : (
            <div className="next-team-flag next-team-flag-empty">No Flag</div>
          )}
          <p className="next-team-name">{teamBName}</p>
          <p className="next-team-votes">{percentB}%</p>
        </button>
      </div>

      <p className="next-match-total">
        {totalVotes.toLocaleString()} votes{submitting ? " - saving..." : ""}
      </p>
      {hasVoted && <p className="world-cup-poll-note">Thanks, your fan poll vote is already recorded.</p>}
      {error && <p className="world-cup-poll-error">{error}</p>}
    </div>
  );
}
