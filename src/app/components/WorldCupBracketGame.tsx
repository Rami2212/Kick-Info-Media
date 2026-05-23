"use client";

import { useMemo, useState } from "react";
import { parseWorldCupVotes, type WorldCupVotes } from "@/lib/worldCupGame";

type Team = {
  name: string;
  flagImageUrl: string;
};

type WorldCupBracketGameProps = {
  matchId: string;
  teamA: Team;
  teamB: Team;
  initialVotes: WorldCupVotes;
};

function getPercent(votes: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((votes / total) * 100);
}

export default function WorldCupBracketGame({
  matchId,
  teamA,
  teamB,
  initialVotes,
}: WorldCupBracketGameProps) {
  const [votes, setVotes] = useState<WorldCupVotes>(initialVotes || {});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  async function submitVote(side: "a" | "b") {
    if (!hasTeams || !matchId || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/world-cup/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, side }),
      });

      const data = (await res.json()) as { error?: string; votes?: WorldCupVotes };
      if (!res.ok) {
        throw new Error(data.error || "Vote submission failed");
      }

      if (data.votes && typeof data.votes === "object") {
        setVotes(parseWorldCupVotes(data.votes));
      }
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
    <div className="next-match-wrap">
      <div className="next-match-grid">
        <button
          type="button"
          className="next-team-card"
          onClick={() => submitVote("a")}
          disabled={submitting}
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
          className="next-team-card"
          onClick={() => submitVote("b")}
          disabled={submitting}
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
      {error && <p className="world-cup-poll-error">{error}</p>}
    </div>
  );
}
