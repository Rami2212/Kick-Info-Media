"use client";

import { type DragEvent, useState } from "react";
import type { ScheduleGroup } from "@/lib/scheduleGroupStage";

type HomeGroupAQuickPickProps = {
  group: ScheduleGroup | null;
};

export default function HomeGroupAQuickPick({ group }: HomeGroupAQuickPickProps) {
  const [teams, setTeams] = useState(() => (group?.teams || []).map((team) => ({ ...team })));
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const groupName = (group?.name || "").trim() || "Group Selection";

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

  return (
    <article className="home-game-pick-panel">
      <p className="home-triple-kicker">Quick Pick</p>
      <h3 className="home-triple-title">{groupName}</h3>
      <p className="home-triple-desc">Drag and reorder teams, then open FIFA Game.</p>

      {!group || teams.length === 0 ? (
        <div className="home-triple-card-blank">
          <p className="home-triple-desc">Group A data is not available.</p>
        </div>
      ) : (
        <form action="/fifa-game" method="get" className="home-group-picker-form">
          <input type="hidden" name="groupAOrder" value={teams.map((team) => team.code).join(",")} />

          <article className="schedule-group-card">
            <header className="schedule-group-card-head">
              <h4 className="schedule-group-card-title">{groupName}</h4>
            </header>

            <div className="schedule-group-table">
              {teams.map((team, index) => (
                <div
                  key={`home-groupA-${team.code}-${team.name}-${index}`}
                  className={`schedule-group-row home-game-pick-row${dropTargetIndex === index ? " schedule-group-row-drop" : ""} schedule-group-row-draggable`}
                  draggable
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
                  <span className="schedule-group-row-name">{team.name}</span>
                  <span className="schedule-group-row-handle">|||</span>
                </div>
              ))}
            </div>
          </article>

          <button type="submit" className="home-triple-link home-group-submit">
            Submit &amp; Open FIFA Game -&gt;
          </button>
        </form>
      )}
    </article>
  );
}
