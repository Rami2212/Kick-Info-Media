"use client";

import { useMemo } from "react";
import type { FifaScheduleFixture } from "@/lib/fifaSchedule";

type Props = {
  fixtures: FifaScheduleFixture[];
};

type GroupedFixture = {
  fixture: FifaScheduleFixture;
  kickoffLabel: string;
  tzLabel: string;
};

type GroupedDay = {
  key: string;
  heading: string;
  fixtures: GroupedFixture[];
};

function parseFixtureUtcDate(dateText: string, timeText: string): Date | null {
  const [month, day, year] = dateText.split("/").map((value) => Number(value));
  const [hour, minute] = timeText.split(":").map((value) => Number(value));
  if (!month || !day || !year) return null;
  const value = Date.UTC(year, month - 1, day, hour || 0, minute || 0);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDayKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value || "0000";
  const month = parts.find((part) => part.type === "month")?.value || "00";
  const day = parts.find((part) => part.type === "day")?.value || "00";
  return `${year}-${month}-${day}`;
}

function stageClassName(stage: string): string {
  const slug = stage
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `fifa-schedule-stage-badge fifa-schedule-stage-${slug}`;
}

function buildGroupedFixtures(fixtures: FifaScheduleFixture[], timeZone: string): GroupedDay[] {
  const sorted = [...fixtures].sort((a, b) => {
    const aTime = parseFixtureUtcDate(a.date, a.time)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bTime = parseFixtureUtcDate(b.date, b.time)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

  const headingFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });

  const grouped = new Map<string, GroupedDay>();

  for (const fixture of sorted) {
    const kickoff = parseFixtureUtcDate(fixture.date, fixture.time);
    if (!kickoff) {
      const rawKey = `raw-${fixture.date}`;
      if (!grouped.has(rawKey)) {
        grouped.set(rawKey, { key: rawKey, heading: fixture.date, fixtures: [] });
      }
      grouped.get(rawKey)?.fixtures.push({
        fixture,
        kickoffLabel: fixture.time || "TBD",
        tzLabel: "UTC",
      });
      continue;
    }

    const dayKey = getDayKey(kickoff, timeZone);
    const heading = headingFormatter.format(kickoff);

    if (!grouped.has(dayKey)) {
      grouped.set(dayKey, { key: dayKey, heading, fixtures: [] });
    }

    const tzLabel =
      new Intl.DateTimeFormat(undefined, {
        timeZone,
        timeZoneName: "short",
      })
        .formatToParts(kickoff)
        .find((part) => part.type === "timeZoneName")?.value || "Local";

    grouped.get(dayKey)?.fixtures.push({
      fixture,
      kickoffLabel: timeFormatter.format(kickoff),
      tzLabel,
    });
  }

  return Array.from(grouped.values());
}

export default function FifaScheduleClient({ fixtures }: Props) {
  const userTimeZone = useMemo(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || "UTC";
  }, []);

  const groupedDays = useMemo(
    () => buildGroupedFixtures(fixtures, userTimeZone),
    [fixtures, userTimeZone],
  );

  return (
    <>
      <div className="fifa-schedule-top">
        <h2 className="football-section-title">Schedule</h2>
        <span className="fifa-schedule-tz">Kickoff times in your timezone ({userTimeZone})</span>
      </div>

      <div className="fifa-schedule-days">
        {groupedDays.map((day) => (
          <section key={day.key} className="fifa-schedule-day">
            <header className="fifa-schedule-day-head">
              <h3 className="fifa-schedule-day-title">{day.heading}</h3>
              <span className="fifa-schedule-day-count">
                {day.fixtures.length} match{day.fixtures.length > 1 ? "es" : ""}
              </span>
            </header>

            <div className="fifa-schedule-list">
              {day.fixtures.map(({ fixture, kickoffLabel, tzLabel }) => {
                const teamA = {
                  name: fixture.teamA?.name || "TBD",
                  flagImageUrl: fixture.teamA?.flagImageUrl || "",
                };
                const teamB = {
                  name: fixture.teamB?.name || "TBD",
                  flagImageUrl: fixture.teamB?.flagImageUrl || "",
                };

                return (
                  <article key={fixture.id} className="fifa-schedule-card">
                    <div className="fifa-schedule-meta">
                      <span className={stageClassName(fixture.stage)}>{fixture.stage}</span>
                      <span className="fifa-schedule-id">{fixture.id}</span>
                    </div>

                    <div className="fifa-schedule-match-row">
                      <div className="fifa-schedule-team fifa-schedule-team-left">
                        {teamA.flagImageUrl ? (
                          <img
                            src={teamA.flagImageUrl}
                            alt={`${teamA.name} flag`}
                            className="fifa-schedule-flag"
                          />
                        ) : (
                          <span className="fifa-schedule-flag fifa-schedule-flag-empty" aria-hidden="true" />
                        )}
                        <span className="fifa-schedule-name">{teamA.name}</span>
                      </div>

                      <div className="fifa-schedule-vs">vs</div>

                      <div className="fifa-schedule-kickoff" aria-label={`Kickoff at ${kickoffLabel} ${tzLabel}`}>
                        <span className="fifa-schedule-time">{kickoffLabel}</span>
                        <small>{tzLabel}</small>
                      </div>

                      <div className="fifa-schedule-team fifa-schedule-team-right">
                        <span className="fifa-schedule-name">{teamB.name}</span>
                        {teamB.flagImageUrl ? (
                          <img
                            src={teamB.flagImageUrl}
                            alt={`${teamB.name} flag`}
                            className="fifa-schedule-flag"
                          />
                        ) : (
                          <span className="fifa-schedule-flag fifa-schedule-flag-empty" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
