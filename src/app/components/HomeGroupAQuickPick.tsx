"use client";

import Link from "next/link";
import { type DragEvent, useEffect, useState } from "react";
import type { ScheduleGroup } from "@/lib/scheduleGroupStage";

type HomeGroupAQuickPickProps = {
  group: ScheduleGroup | null;
};

const EMPTY_TEAM = { code: "", name: "", flagImageUrl: "" };

function sameTeam(
  a: { code?: string; name?: string; flagImageUrl?: string } | null | undefined,
  b: { code?: string; name?: string; flagImageUrl?: string } | null | undefined,
): boolean {
  return (
    (a?.code || "").trim().toUpperCase() === (b?.code || "").trim().toUpperCase() &&
    (a?.name || "").trim().toLowerCase() === (b?.name || "").trim().toLowerCase() &&
    (a?.flagImageUrl || "").trim() === (b?.flagImageUrl || "").trim()
  );
}

function isEmptyTeam(team: { code?: string; name?: string } | null | undefined): boolean {
  return !((team?.code || "").trim() || (team?.name || "").trim());
}

export default function HomeGroupAQuickPick({ group }: HomeGroupAQuickPickProps) {
  const catalogTeams = (group?.teams || []).map((team) => ({ ...team }));
  const groupName = (group?.name || "").trim() || "Group Selection";
  const [teams, setTeams] = useState(() => catalogTeams.map(() => ({ ...EMPTY_TEAM })));
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const syncTouchState = () => setIsTouchDevice(mediaQuery.matches);
    syncTouchState();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncTouchState);
      return () => mediaQuery.removeEventListener("change", syncTouchState);
    }

    mediaQuery.addListener(syncTouchState);
    return () => mediaQuery.removeListener(syncTouchState);
  }, []);

  function onReset() {
    setTeams(catalogTeams.map(() => ({ ...EMPTY_TEAM })));
    setDragSourceIndex(null);
    setDropTargetIndex(null);
  }

  function onTeamChipClick(team: (typeof catalogTeams)[number]) {
    setTeams((prev) => {
      const next = prev.map((item) => ({ ...item }));
      const existingIndex = next.findIndex((rowTeam) => sameTeam(rowTeam, team));

      if (existingIndex >= 0) {
        const compact = next.filter((_, index) => index !== existingIndex);
        while (compact.length < catalogTeams.length) compact.push({ ...EMPTY_TEAM });
        return compact;
      }

      const emptyIndex = next.findIndex((rowTeam) => isEmptyTeam(rowTeam));
      if (emptyIndex < 0) return prev;
      next[emptyIndex] = { ...team };
      return next;
    });
  }

  function onDragStart(event: DragEvent<HTMLDivElement>, index: number) {
    event.dataTransfer.effectAllowed = "move";
    setDragSourceIndex(index);
    setDropTargetIndex(null);
  }

  function onDragOver(event: DragEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetIndex(index);
  }

  function onDrop(event: DragEvent<HTMLDivElement>, index: number) {
    event.preventDefault();

    if (dragSourceIndex === null || dragSourceIndex === index) {
      setDragSourceIndex(null);
      setDropTargetIndex(null);
      return;
    }

    setTeams((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragSourceIndex, 1);
      if (!moved) return prev;
      next.splice(index, 0, moved);
      return next;
    });

    setDragSourceIndex(null);
    setDropTargetIndex(null);
  }

  function onDragEnd() {
    setDragSourceIndex(null);
    setDropTargetIndex(null);
  }

  function moveTeamByStep(fromIndex: number, delta: -1 | 1) {
    const toIndex = fromIndex + delta;
    if (toIndex < 0 || toIndex >= teams.length) return;

    setTeams((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  return (
    <article className="home-game-pick-panel">
      <p className="home-triple-kicker">Quick Pick</p>
      <h3 className="home-triple-title">{groupName}</h3>
      <p className="home-triple-desc">Preview the FIFA game group board.</p>

      {!group || teams.length === 0 ? (
        <div className="home-triple-card-blank">
          <p className="home-triple-desc">Group A data is not available.</p>
        </div>
      ) : (
        <div className="home-group-picker-form">
          <article className="schedule-group-card">
            <header className="schedule-group-card-head">
              <h4 className="schedule-group-card-title">{groupName}</h4>
              <div className="schedule-group-card-tools">
                <button type="button" className="schedule-group-reset-button" onClick={onReset}>
                  Reset
                </button>
                <span className="schedule-group-head-icon" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </header>

            <div className="schedule-group-chip-row">
              {catalogTeams.map((team, index) => {
                const selected = teams.some((rowTeam) => sameTeam(rowTeam, team));
                return (
                <button
                  key={`home-groupA-chip-${team.code}-${team.name}-${index}`}
                  type="button"
                  className={`schedule-group-chip schedule-group-chip-button${selected ? " schedule-group-chip-selected" : ""}`}
                  onClick={() => onTeamChipClick(team)}
                >
                  {team.flagImageUrl ? (
                    <img src={team.flagImageUrl} alt={`${team.name} flag`} className="schedule-group-chip-flag" />
                  ) : (
                    <span className="schedule-group-chip-flag schedule-group-chip-flag-empty" aria-hidden="true" />
                  )}
                  <span>{team.code || "-"}</span>
                </button>
              );
              })}
            </div>

            <div className="schedule-group-table">
              {teams.map((team, index) => (
                <div
                  key={`home-groupA-row-${team.code}-${team.name}-${index}`}
                  className={`schedule-group-row home-game-pick-row schedule-group-row-draggable${dropTargetIndex === index ? " schedule-group-row-drop" : ""}`}
                  draggable={!isTouchDevice}
                  onDragStart={(event) => onDragStart(event, index)}
                  onDragOver={(event) => onDragOver(event, index)}
                  onDrop={(event) => onDrop(event, index)}
                  onDragEnd={onDragEnd}
                >
                  <span className="schedule-group-rank">{index + 1}</span>
                  {team.flagImageUrl ? (
                    <img src={team.flagImageUrl} alt={`${team.name} flag`} className="schedule-group-row-flag" />
                  ) : (
                    <span className="schedule-group-row-flag schedule-group-chip-flag-empty" aria-hidden="true" />
                  )}
                  <span className="schedule-group-row-name">{team.name || "-"}</span>
                  {isTouchDevice ? (
                    <span className="schedule-group-row-mobile-move" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className="schedule-group-row-move-btn"
                        aria-label={`Move ${team.name || "team"} up`}
                        onClick={() => moveTeamByStep(index, -1)}
                        disabled={index === 0}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="schedule-group-row-move-btn"
                        aria-label={`Move ${team.name || "team"} down`}
                        onClick={() => moveTeamByStep(index, 1)}
                        disabled={index === teams.length - 1}
                      >
                        ▼
                      </button>
                    </span>
                  ) : (
                    <span className="schedule-group-row-handle" aria-hidden="true">|||</span>
                  )}
                </div>
              ))}
            </div>
          </article>

          <Link href="/fifa-game" className="admin-button admin-button-blue home-group-submit">
            Submit
          </Link>
        </div>
      )}
    </article>
  );
}
