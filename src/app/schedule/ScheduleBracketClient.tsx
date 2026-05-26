"use client";

import { type DragEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScheduleBracketSlot } from "@/lib/scheduleBracket";
import type { ScheduleGroup } from "@/lib/scheduleGroupStage";
import ResponsiveAdSlotsBar from "@/app/components/ads/ResponsiveAdSlotsBar";

type StageSide = "left" | "right" | "center";

type BracketMatch = {
  id: string;
  date: string;
  time: string;
  slotA: number;
  slotB: number;
  x: number;
  row: number;
  side: StageSide;
  title?: string;
};

type MatchConnection = {
  from: string;
  to: string;
};

type MatchOutcome = {
  winnerSlotId: number;
  loserSlotId?: number;
};

type GroupDragPoint = {
  groupIndex: number;
  teamIndex: number;
};

type ThirdPlaceDragPoint = {
  index: number;
};

type ThirdPlaceCandidate = {
  groupId: string;
  groupName: string;
  code: string;
  name: string;
  flagImageUrl: string;
};

const CARD_WIDTH = 178;
const CARD_HEIGHT = 92;
const ROW_GAP = 110;
const TOP_OFFSET = 76;
const CANVAS_WIDTH = 1880;
const CANVAS_HEIGHT = 950;

const COL_X = {
  left32: 10,
  left16: 220,
  leftQf: 430,
  leftSf: 640,
  center: 851,
  rightSf: 1062,
  rightQf: 1273,
  right16: 1484,
  right32: 1695,
} as const;

const STAGE_HEADERS = [
  { label: "Round of 32", x: COL_X.left32 },
  { label: "Round of 16", x: COL_X.left16 },
  { label: "Quarter-final", x: COL_X.leftQf },
  { label: "Semi-final", x: COL_X.leftSf },
  { label: "Semi-final", x: COL_X.rightSf },
  { label: "Quarter-final", x: COL_X.rightQf },
  { label: "Round of 16", x: COL_X.right16 },
  { label: "Round of 32", x: COL_X.right32 },
] as const;

const LEFT_R32: BracketMatch[] = [
  { id: "M74", date: "06/30/2026", time: "02:00", slotA: 1, slotB: 2, x: COL_X.left32, row: 0, side: "left" },
  { id: "M77", date: "07/01/2026", time: "02:30", slotA: 3, slotB: 4, x: COL_X.left32, row: 1, side: "left" },
  { id: "M73", date: "06/29/2026", time: "00:30", slotA: 5, slotB: 6, x: COL_X.left32, row: 2, side: "left" },
  { id: "M75", date: "06/30/2026", time: "06:30", slotA: 7, slotB: 8, x: COL_X.left32, row: 3, side: "left" },
  { id: "M83", date: "07/03/2026", time: "04:30", slotA: 9, slotB: 10, x: COL_X.left32, row: 4, side: "left" },
  { id: "M84", date: "07/03/2026", time: "00:30", slotA: 11, slotB: 12, x: COL_X.left32, row: 5, side: "left" },
  { id: "M81", date: "07/02/2026", time: "05:30", slotA: 13, slotB: 14, x: COL_X.left32, row: 6, side: "left" },
  { id: "M82", date: "07/02/2026", time: "01:30", slotA: 15, slotB: 16, x: COL_X.left32, row: 7, side: "left" },
];

const LEFT_R16: BracketMatch[] = [
  { id: "M89", date: "07/05/2026", time: "02:30", slotA: 17, slotB: 18, x: COL_X.left16, row: 0.5, side: "left" },
  { id: "M90", date: "07/04/2026", time: "22:30", slotA: 19, slotB: 20, x: COL_X.left16, row: 2.5, side: "left" },
  { id: "M93", date: "07/07/2026", time: "00:30", slotA: 21, slotB: 22, x: COL_X.left16, row: 4.5, side: "left" },
  { id: "M94", date: "07/07/2026", time: "05:30", slotA: 23, slotB: 24, x: COL_X.left16, row: 6.5, side: "left" },
];

const LEFT_QF: BracketMatch[] = [
  { id: "M97", date: "07/10/2026", time: "01:30", slotA: 25, slotB: 26, x: COL_X.leftQf, row: 1.5, side: "left" },
  { id: "M98", date: "07/11/2026", time: "00:30", slotA: 27, slotB: 28, x: COL_X.leftQf, row: 5.5, side: "left" },
];

const LEFT_SF: BracketMatch[] = [
  { id: "M101", date: "07/15/2026", time: "00:30", slotA: 29, slotB: 30, x: COL_X.leftSf, row: 4.0, side: "left" },
];

const RIGHT_SF: BracketMatch[] = [
  { id: "M102", date: "07/16/2026", time: "00:30", slotA: 33, slotB: 34, x: COL_X.rightSf, row: 4.0, side: "right" },
];

const RIGHT_QF: BracketMatch[] = [
  { id: "M99", date: "07/12/2026", time: "02:30", slotA: 35, slotB: 36, x: COL_X.rightQf, row: 1.5, side: "right" },
  { id: "M100", date: "07/12/2026", time: "06:30", slotA: 37, slotB: 38, x: COL_X.rightQf, row: 5.5, side: "right" },
];

const RIGHT_R16: BracketMatch[] = [
  { id: "M91", date: "07/06/2026", time: "01:30", slotA: 39, slotB: 40, x: COL_X.right16, row: 0.5, side: "right" },
  { id: "M92", date: "07/06/2026", time: "05:30", slotA: 41, slotB: 42, x: COL_X.right16, row: 2.5, side: "right" },
  { id: "M95", date: "07/07/2026", time: "21:30", slotA: 43, slotB: 44, x: COL_X.right16, row: 4.5, side: "right" },
  { id: "M96", date: "07/08/2026", time: "01:30", slotA: 45, slotB: 46, x: COL_X.right16, row: 6.5, side: "right" },
];

const RIGHT_R32: BracketMatch[] = [
  { id: "M76", date: "06/29/2026", time: "22:30", slotA: 47, slotB: 48, x: COL_X.right32, row: 0, side: "right" },
  { id: "M78", date: "06/30/2026", time: "22:30", slotA: 49, slotB: 50, x: COL_X.right32, row: 1, side: "right" },
  { id: "M79", date: "07/01/2026", time: "06:30", slotA: 51, slotB: 52, x: COL_X.right32, row: 2, side: "right" },
  { id: "M80", date: "07/01/2026", time: "21:30", slotA: 53, slotB: 54, x: COL_X.right32, row: 3, side: "right" },
  { id: "M86", date: "07/04/2026", time: "03:30", slotA: 55, slotB: 56, x: COL_X.right32, row: 4, side: "right" },
  { id: "M88", date: "07/03/2026", time: "23:30", slotA: 57, slotB: 58, x: COL_X.right32, row: 5, side: "right" },
  { id: "M85", date: "07/03/2026", time: "08:30", slotA: 59, slotB: 60, x: COL_X.right32, row: 6, side: "right" },
  { id: "M87", date: "07/04/2026", time: "07:00", slotA: 61, slotB: 62, x: COL_X.right32, row: 7, side: "right" },
];

const CENTER_MATCHES: BracketMatch[] = [
  {
    id: "M104",
    date: "07/20/2026",
    time: "00:30",
    slotA: 31,
    slotB: 32,
    x: COL_X.center,
    row: 2.6,
    side: "center",
    title: "Final",
  },
  {
    id: "M103",
    date: "07/19/2026",
    time: "02:30",
    slotA: 63,
    slotB: 64,
    x: COL_X.center,
    row: 5.4,
    side: "center",
    title: "Play-off for third place",
  },
];

const CONNECTIONS: MatchConnection[] = [
  { from: "M74", to: "M89" }, { from: "M77", to: "M89" },
  { from: "M73", to: "M90" }, { from: "M75", to: "M90" },
  { from: "M83", to: "M93" }, { from: "M84", to: "M93" },
  { from: "M81", to: "M94" }, { from: "M82", to: "M94" },
  { from: "M89", to: "M97" }, { from: "M90", to: "M97" },
  { from: "M93", to: "M98" }, { from: "M94", to: "M98" },
  { from: "M97", to: "M101" }, { from: "M98", to: "M101" },
  { from: "M76", to: "M91" }, { from: "M78", to: "M91" },
  { from: "M79", to: "M92" }, { from: "M80", to: "M92" },
  { from: "M86", to: "M95" }, { from: "M88", to: "M95" },
  { from: "M85", to: "M96" }, { from: "M87", to: "M96" },
  { from: "M91", to: "M99" }, { from: "M92", to: "M99" },
  { from: "M95", to: "M100" }, { from: "M96", to: "M100" },
  { from: "M99", to: "M102" }, { from: "M100", to: "M102" },
  { from: "M101", to: "M104" }, { from: "M102", to: "M104" },
  { from: "M101", to: "M103" }, { from: "M102", to: "M103" },
];

const MATCH_OUTCOMES: Record<string, MatchOutcome> = {
  M74: { winnerSlotId: 17 },
  M77: { winnerSlotId: 18 },
  M73: { winnerSlotId: 19 },
  M75: { winnerSlotId: 20 },
  M83: { winnerSlotId: 21 },
  M84: { winnerSlotId: 22 },
  M81: { winnerSlotId: 23 },
  M82: { winnerSlotId: 24 },
  M89: { winnerSlotId: 25 },
  M90: { winnerSlotId: 26 },
  M93: { winnerSlotId: 27 },
  M94: { winnerSlotId: 28 },
  M97: { winnerSlotId: 29 },
  M98: { winnerSlotId: 30 },
  M76: { winnerSlotId: 39 },
  M78: { winnerSlotId: 40 },
  M79: { winnerSlotId: 41 },
  M80: { winnerSlotId: 42 },
  M86: { winnerSlotId: 43 },
  M88: { winnerSlotId: 44 },
  M85: { winnerSlotId: 45 },
  M87: { winnerSlotId: 46 },
  M91: { winnerSlotId: 35 },
  M92: { winnerSlotId: 36 },
  M95: { winnerSlotId: 37 },
  M96: { winnerSlotId: 38 },
  M99: { winnerSlotId: 33 },
  M100: { winnerSlotId: 34 },
  M101: { winnerSlotId: 31, loserSlotId: 63 },
  M102: { winnerSlotId: 32, loserSlotId: 64 },
};

const ALL_MATCHES: BracketMatch[] = [
  ...LEFT_R32,
  ...LEFT_R16,
  ...LEFT_QF,
  ...LEFT_SF,
  ...RIGHT_SF,
  ...RIGHT_QF,
  ...RIGHT_R16,
  ...RIGHT_R32,
  ...CENTER_MATCHES,
];

const THIRD_PLACE_SLOT_IDS = [2, 4, 14, 16, 52, 54, 60, 62] as const;

const GROUP_SLOT_MAP: Record<string, { first: number; second: number }> = {
  A: { first: 51, second: 5 },
  B: { first: 59, second: 6 },
  C: { first: 47, second: 8 },
  D: { first: 13, second: 57 },
  E: { first: 1, second: 49 },
  F: { first: 7, second: 48 },
  G: { first: 15, second: 58 },
  H: { first: 11, second: 56 },
  I: { first: 3, second: 50 },
  J: { first: 55, second: 12 },
  K: { first: 61, second: 10 },
  L: { first: 53, second: 9 },
};

const EMPTY_GROUP_TEAM = { code: "", name: "", flagImageUrl: "" };
const SAVED_EMPTY_GROUP_TEAM = { code: "-", name: "TBD", flagImageUrl: "" };

function normalizeName(value: string | undefined): string {
  const clean = (value || "").trim().toLowerCase();
  return clean === "tbd" ? "" : clean;
}

function normalizeCode(value: string | undefined): string {
  const clean = (value || "").trim().toUpperCase();
  return clean === "-" ? "" : clean;
}

function isEmptyGroupTeam(team: { code?: string; name?: string } | null | undefined): boolean {
  return !normalizeCode(team?.code) && !normalizeName(team?.name);
}

function sameGroupTeam(
  a: { code?: string; name?: string; flagImageUrl?: string } | null | undefined,
  b: { code?: string; name?: string; flagImageUrl?: string } | null | undefined,
): boolean {
  return (
    normalizeCode(a?.code) === normalizeCode(b?.code) &&
    normalizeName(a?.name) === normalizeName(b?.name) &&
    (a?.flagImageUrl || "").trim() === (b?.flagImageUrl || "").trim()
  );
}

function isSameTeam(a: ScheduleBracketSlot | undefined, b: ScheduleBracketSlot | undefined): boolean {
  const aName = normalizeName(a?.name);
  const bName = normalizeName(b?.name);
  if (!aName || !bName) return false;
  return aName === bName && (a?.flagImageUrl || "").trim() === (b?.flagImageUrl || "").trim();
}

function buildWinnerMap(slots: ScheduleBracketSlot[]): Record<string, number> {
  const byId = new Map(slots.map((slot) => [slot.id, slot]));
  const winners: Record<string, number> = {};

  for (const match of ALL_MATCHES) {
    const outcome = MATCH_OUTCOMES[match.id];
    if (!outcome) continue;

    const target = byId.get(outcome.winnerSlotId);
    const teamA = byId.get(match.slotA);
    const teamB = byId.get(match.slotB);
    if (isSameTeam(target, teamA)) winners[match.id] = match.slotA;
    else if (isSameTeam(target, teamB)) winners[match.id] = match.slotB;
  }

  return winners;
}

function cloneGroups(groups: ScheduleGroup[]): ScheduleGroup[] {
  return groups.map((group) => ({
    ...group,
    teams: group.teams.map((team) => ({ ...team })),
  }));
}

function normalizeGroupsForEditor(groups: ScheduleGroup[]): ScheduleGroup[] {
  return groups.map((group) => ({
    ...group,
    teams: group.teams.map((team) =>
      isEmptyGroupTeam(team)
        ? { ...EMPTY_GROUP_TEAM }
        : {
            code: (team.code || "").trim(),
            name: (team.name || "").trim(),
            flagImageUrl: (team.flagImageUrl || "").trim(),
          },
    ),
  }));
}

function createEmptyGroupsFromTemplate(groups: ScheduleGroup[]): ScheduleGroup[] {
  return groups.map((group) => ({
    ...group,
    teams: group.teams.map(() => ({ ...EMPTY_GROUP_TEAM })),
  }));
}

function toSavableGroups(groups: ScheduleGroup[]): ScheduleGroup[] {
  return groups.map((group) => ({
    ...group,
    teams: group.teams.map((team) =>
      isEmptyGroupTeam(team)
        ? { ...SAVED_EMPTY_GROUP_TEAM }
        : {
            code: (team.code || "").trim(),
            name: (team.name || "").trim(),
            flagImageUrl: (team.flagImageUrl || "").trim(),
          },
    ),
  }));
}

function buildThirdPlaceCandidates(groups: ScheduleGroup[]): ThirdPlaceCandidate[] {
  return groups.map((group) => {
    const third = group.teams[2];
    const hasThird = !!third && !isEmptyGroupTeam(third);
    return {
      groupId: group.id,
      groupName: group.name,
      code: hasThird ? third.code : "-",
      name: hasThird ? third.name : "TBD",
      flagImageUrl: hasThird ? (third.flagImageUrl || "") : "",
    };
  });
}

function syncSlotsWithGroupPlacements(slots: ScheduleBracketSlot[], groups: ScheduleGroup[]): ScheduleBracketSlot[] {
  const assignments = new Map<number, { name: string; flagImageUrl: string }>();

  for (const group of groups) {
    const key = (group.id || "").trim().toUpperCase();
    const mapping = GROUP_SLOT_MAP[key];
    if (!mapping) continue;

    const first = group.teams[0];
    const second = group.teams[1];

    assignments.set(mapping.first, {
      name: first?.name?.trim() || "TBD",
      flagImageUrl: first?.flagImageUrl?.trim() || "",
    });

    assignments.set(mapping.second, {
      name: second?.name?.trim() || "TBD",
      flagImageUrl: second?.flagImageUrl?.trim() || "",
    });
  }

  return slots.map((slot) => {
    const next = assignments.get(slot.id);
    if (!next) return slot;
    return {
      ...slot,
      name: next.name,
      flagImageUrl: next.flagImageUrl,
    };
  });
}

function normalizeThirdPlaceOrder(order: string[], candidates: ThirdPlaceCandidate[]): string[] {
  const valid = new Set(candidates.map((candidate) => candidate.groupId));
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const groupId of order) {
    if (!valid.has(groupId) || seen.has(groupId)) continue;
    normalized.push(groupId);
    seen.add(groupId);
  }

  for (const candidate of candidates) {
    if (seen.has(candidate.groupId)) continue;
    normalized.push(candidate.groupId);
    seen.add(candidate.groupId);
  }

  return normalized;
}

function buildInitialThirdPlaceOrder(groups: ScheduleGroup[], slots: ScheduleBracketSlot[]): string[] {
  const candidates = buildThirdPlaceCandidates(groups);
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
  const seededOrder: string[] = [];

  for (const slotId of THIRD_PLACE_SLOT_IDS) {
    const slot = slotMap.get(slotId);
    if (!slot) continue;

    const matched = candidates.find(
      (candidate) =>
        normalizeName(candidate.name) === normalizeName(slot.name) &&
        candidate.flagImageUrl.trim() === (slot.flagImageUrl || "").trim(),
    );
    if (matched) {
      seededOrder.push(matched.groupId);
    }
  }

  return normalizeThirdPlaceOrder(seededOrder, candidates);
}

function syncSlotsWithThirdPlaceOrder(
  slots: ScheduleBracketSlot[],
  groups: ScheduleGroup[],
  thirdPlaceOrder: string[],
): ScheduleBracketSlot[] {
  const candidates = buildThirdPlaceCandidates(groups);
  const candidateByGroupId = new Map(candidates.map((candidate) => [candidate.groupId, candidate]));
  const normalizedOrder = normalizeThirdPlaceOrder(thirdPlaceOrder, candidates);
  const targetIds = new Set<number>(THIRD_PLACE_SLOT_IDS);

  return slots.map((slot) => {
    if (!targetIds.has(slot.id)) return slot;

    const slotIndex = THIRD_PLACE_SLOT_IDS.indexOf(slot.id as (typeof THIRD_PLACE_SLOT_IDS)[number]);
    const groupId = slotIndex >= 0 ? normalizedOrder[slotIndex] : "";
    const selected = groupId ? candidateByGroupId.get(groupId) : null;

    return {
      ...slot,
      name: selected?.name || "TBD",
      flagImageUrl: selected?.flagImageUrl || "",
    };
  });
}

function syncSlotsFromSelections(
  slots: ScheduleBracketSlot[],
  groups: ScheduleGroup[],
  thirdPlaceOrder: string[],
): ScheduleBracketSlot[] {
  const withGroupPlacements = syncSlotsWithGroupPlacements(slots, groups);
  return syncSlotsWithThirdPlaceOrder(withGroupPlacements, groups, thirdPlaceOrder);
}

export default function ScheduleBracketClient({
  initialSlots,
  initialGroups,
  isLoggedIn,
  mode = "editor",
  catalogGroups,
  startEmptySelection = false,
}: {
  initialSlots: ScheduleBracketSlot[];
  initialGroups: ScheduleGroup[];
  isLoggedIn: boolean;
  mode?: "editor" | "viewer";
  catalogGroups?: ScheduleGroup[];
  startEmptySelection?: boolean;
}) {
  const isViewer = mode === "viewer";
  const router = useRouter();
  const groupCatalog = useMemo(
    () => normalizeGroupsForEditor(catalogGroups && catalogGroups.length > 0 ? catalogGroups : initialGroups),
    [catalogGroups, initialGroups],
  );
  const editorInitialGroups = useMemo(() => {
    const base = normalizeGroupsForEditor(initialGroups);
    return startEmptySelection ? createEmptyGroupsFromTemplate(groupCatalog.length ? groupCatalog : base) : base;
  }, [groupCatalog, initialGroups, startEmptySelection]);
  const [groups, setGroups] = useState<ScheduleGroup[]>(editorInitialGroups);
  const [thirdPlaceOrder, setThirdPlaceOrder] = useState<string[]>(() =>
    buildInitialThirdPlaceOrder(editorInitialGroups, initialSlots),
  );
  const [slots, setSlots] = useState<ScheduleBracketSlot[]>(() =>
    syncSlotsFromSelections(
      initialSlots,
      editorInitialGroups,
      buildInitialThirdPlaceOrder(editorInitialGroups, initialSlots),
    ),
  );
  const [groupDragSource, setGroupDragSource] = useState<GroupDragPoint | null>(null);
  const [groupDropTarget, setGroupDropTarget] = useState<GroupDragPoint | null>(null);
  const [groupTapSource, setGroupTapSource] = useState<GroupDragPoint | null>(null);
  const [thirdPlaceDragSource, setThirdPlaceDragSource] = useState<ThirdPlaceDragPoint | null>(null);
  const [thirdPlaceDropTarget, setThirdPlaceDropTarget] = useState<ThirdPlaceDragPoint | null>(null);
  const [thirdPlaceTapSource, setThirdPlaceTapSource] = useState<ThirdPlaceDragPoint | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [canvasWidth, setCanvasWidth] = useState(CANVAS_WIDTH);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const bracketScrollerRef = useRef<HTMLDivElement | null>(null);
  const matchCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const loginRedirectPath = "/login?callbackUrl=%2Ffifa-game";
  const registerRedirectPath = "/register?callbackUrl=%2Ffifa-game";
  const widthScale = canvasWidth / CANVAS_WIDTH;
  const cardWidth = CARD_WIDTH * widthScale;

  useEffect(() => {
    const scroller = bracketScrollerRef.current;
    if (!scroller) return;

    const updateCanvasWidth = () => {
      const viewportWidth = scroller.clientWidth || 0;
      const nextWidth = Math.max(CANVAS_WIDTH, viewportWidth);
      setCanvasWidth((prev) => (prev === nextWidth ? prev : nextWidth));
    };

    updateCanvasWidth();
    const observer = new ResizeObserver(updateCanvasWidth);
    observer.observe(scroller);
    window.addEventListener("resize", updateCanvasWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateCanvasWidth);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const updateTouchState = () => setIsTouchDevice(mediaQuery.matches);
    updateTouchState();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateTouchState);
      return () => mediaQuery.removeEventListener("change", updateTouchState);
    }

    mediaQuery.addListener(updateTouchState);
    return () => mediaQuery.removeListener(updateTouchState);
  }, []);

  const slotMap = useMemo(() => new Map(slots.map((slot) => [slot.id, slot])), [slots]);
  const winnerByMatch = useMemo(() => buildWinnerMap(slots), [slots]);
  const thirdPlaceCandidates = useMemo(() => buildThirdPlaceCandidates(groups), [groups]);

  const positioned = useMemo(
    () =>
      ALL_MATCHES.map((match) => ({
        ...match,
        x: match.x * widthScale,
        y: TOP_OFFSET + match.row * ROW_GAP,
      })),
    [widthScale],
  );

  const byId = useMemo(() => new Map(positioned.map((match) => [match.id, match])), [positioned]);

  function redirectToLogin() {
    router.push(loginRedirectPath);
  }

  function centerMatchCardInView(matchId: string) {
    if (!isTouchDevice) return;

    const scroller = bracketScrollerRef.current;
    const card = matchCardRefs.current[matchId];
    if (!scroller || !card) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);

    const deltaLeft = cardRect.left - scrollerRect.left - (scroller.clientWidth - cardRect.width) / 2;
    const deltaTop = cardRect.top - scrollerRect.top - (scroller.clientHeight - cardRect.height) / 2;

    const targetLeft = Math.min(maxScrollLeft, Math.max(0, scroller.scrollLeft + deltaLeft));
    const targetTop = Math.min(maxScrollTop, Math.max(0, scroller.scrollTop + deltaTop));

    scroller.scrollTo({
      left: targetLeft,
      top: targetTop,
      behavior: "smooth",
    });

    card.focus({ preventScroll: true });
  }

  function applyMatchWinner(match: BracketMatch, selectedSlotId: number) {
    if (isViewer) return;
    centerMatchCardInView(match.id);
    const outcome = MATCH_OUTCOMES[match.id];
    if (!outcome) return;

    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }

    setSaved(false);
    setError("");

    setSlots((prev) => {
      const prevMap = new Map(prev.map((slot) => [slot.id, slot]));
      const winnerSource = prevMap.get(selectedSlotId);
      const loserSource = prevMap.get(selectedSlotId === match.slotA ? match.slotB : match.slotA);

      return prev.map((slot) => {
        if (slot.id === outcome.winnerSlotId) {
          return {
            ...slot,
            name: winnerSource?.name?.trim() || "TBD",
            flagImageUrl: winnerSource?.flagImageUrl?.trim() || "",
          };
        }

        if (outcome.loserSlotId && slot.id === outcome.loserSlotId) {
          return {
            ...slot,
            name: loserSource?.name?.trim() || "TBD",
            flagImageUrl: loserSource?.flagImageUrl?.trim() || "",
          };
        }

        return slot;
      });
    });
  }

  function onTeamRowKeyDown(event: KeyboardEvent<HTMLDivElement>, match: BracketMatch, slotId: number) {
    if (isViewer) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      applyMatchWinner(match, slotId);
    }
  }

  function swapGroupTeams(source: GroupDragPoint, target: GroupDragPoint) {
    if (source.groupIndex === target.groupIndex && source.teamIndex === target.teamIndex) return;

    setGroups((prev) => {
      const next = cloneGroups(prev);
      const sourceGroup = next[source.groupIndex];
      const targetGroup = next[target.groupIndex];
      if (!sourceGroup || !targetGroup) return prev;

      const sourceTeam = sourceGroup.teams[source.teamIndex];
      const targetTeam = targetGroup.teams[target.teamIndex];
      if (!sourceTeam || !targetTeam) return prev;

      sourceGroup.teams[source.teamIndex] = targetTeam;
      targetGroup.teams[target.teamIndex] = sourceTeam;

      setSlots((prevSlots) => syncSlotsFromSelections(prevSlots, next, thirdPlaceOrder));
      return next;
    });

    setSaved(false);
    setError("");
  }

  function moveThirdPlace(source: ThirdPlaceDragPoint, target: ThirdPlaceDragPoint) {
    if (source.index === target.index) return;

    setSaved(false);
    setError("");

    setThirdPlaceOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(source.index, 1);
      if (!moved) return prev;
      next.splice(target.index, 0, moved);
      setSlots((prevSlots) => syncSlotsFromSelections(prevSlots, groups, next));
      return next;
    });
  }

  function onGroupTeamDragStart(event: DragEvent<HTMLDivElement>, source: GroupDragPoint) {
    if (isViewer) return;
    if (!isLoggedIn) {
      event.preventDefault();
      redirectToLogin();
      return;
    }
    const sourceTeam = groups[source.groupIndex]?.teams[source.teamIndex];
    if (!sourceTeam || isEmptyGroupTeam(sourceTeam)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    setGroupTapSource(null);
    setGroupDragSource(source);
    setGroupDropTarget(null);
  }

  function onGroupTeamDragOver(event: DragEvent<HTMLDivElement>, target: GroupDragPoint) {
    if (isViewer) return;
    if (!isLoggedIn) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setGroupDropTarget(target);
  }

  function onGroupTeamDrop(event: DragEvent<HTMLDivElement>, target: GroupDragPoint) {
    if (isViewer) return;
    if (!isLoggedIn) {
      event.preventDefault();
      redirectToLogin();
      return;
    }

    event.preventDefault();
    const source = groupDragSource;
    setGroupDropTarget(null);
    setGroupDragSource(null);
    setGroupTapSource(null);

    if (!source) return;
    swapGroupTeams(source, target);
  }

  function onGroupTeamDragEnd() {
    if (isViewer) return;
    setGroupDropTarget(null);
    setGroupDragSource(null);
  }

  function onGroupTeamRowClick(target: GroupDragPoint) {
    if (isViewer) return;
    if (groupDragSource) return;
    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }

    const targetTeam = groups[target.groupIndex]?.teams[target.teamIndex];
    if (!targetTeam) return;

    if (!groupTapSource) {
      if (isEmptyGroupTeam(targetTeam)) return;
      setGroupTapSource(target);
      setGroupDropTarget(target);
      return;
    }

    if (groupTapSource.groupIndex === target.groupIndex && groupTapSource.teamIndex === target.teamIndex) {
      setGroupTapSource(null);
      setGroupDropTarget(null);
      return;
    }

    const source = groupTapSource;
    setGroupTapSource(null);
    setGroupDropTarget(null);
    swapGroupTeams(source, target);
  }

  function onGroupTeamChipClick(groupIndex: number, team: ScheduleGroup["teams"][number]) {
    if (isViewer) return;
    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }
    if (isEmptyGroupTeam(team)) return;

    setGroupTapSource(null);
    setGroupDropTarget(null);
    setSaved(false);
    setError("");

    setGroups((prev) => {
      const next = cloneGroups(prev);
      const group = next[groupIndex];
      if (!group) return prev;

      const existingIndex = group.teams.findIndex((rowTeam) => sameGroupTeam(rowTeam, team));
      if (existingIndex >= 0) {
        const compact = group.teams.filter((_, index) => index !== existingIndex);
        while (compact.length < 4) compact.push({ ...EMPTY_GROUP_TEAM });
        group.teams = compact;
      } else {
        const emptyIndex = group.teams.findIndex((rowTeam) => isEmptyGroupTeam(rowTeam));
        if (emptyIndex < 0) return prev;
        group.teams[emptyIndex] = {
          code: (team.code || "").trim(),
          name: (team.name || "").trim(),
          flagImageUrl: (team.flagImageUrl || "").trim(),
        };
      }

      setSlots((prevSlots) => syncSlotsFromSelections(prevSlots, next, thirdPlaceOrder));
      return next;
    });
  }

  function resetGroupSelection(groupIndex: number) {
    if (isViewer) return;
    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }

    setGroupTapSource(null);
    setGroupDropTarget(null);
    setSaved(false);
    setError("");

    setGroups((prev) => {
      const next = cloneGroups(prev);
      const group = next[groupIndex];
      if (!group) return prev;
      group.teams = group.teams.map(() => ({ ...EMPTY_GROUP_TEAM }));
      setSlots((prevSlots) => syncSlotsFromSelections(prevSlots, next, thirdPlaceOrder));
      return next;
    });
  }

  function onThirdPlaceDragStart(event: DragEvent<HTMLDivElement>, source: ThirdPlaceDragPoint) {
    if (isViewer) return;
    if (!isLoggedIn) {
      event.preventDefault();
      redirectToLogin();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    setThirdPlaceTapSource(null);
    setThirdPlaceDragSource(source);
    setThirdPlaceDropTarget(null);
  }

  function onThirdPlaceDragOver(event: DragEvent<HTMLDivElement>, target: ThirdPlaceDragPoint) {
    if (isViewer) return;
    if (!isLoggedIn) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setThirdPlaceDropTarget(target);
  }

  function onThirdPlaceDrop(event: DragEvent<HTMLDivElement>, target: ThirdPlaceDragPoint) {
    if (isViewer) return;
    if (!isLoggedIn) {
      event.preventDefault();
      redirectToLogin();
      return;
    }

    event.preventDefault();
    const source = thirdPlaceDragSource;
    setThirdPlaceDragSource(null);
    setThirdPlaceDropTarget(null);
    setThirdPlaceTapSource(null);
    if (!source || source.index === target.index) return;
    moveThirdPlace(source, target);
  }

  function onThirdPlaceDragEnd() {
    if (isViewer) return;
    setThirdPlaceDragSource(null);
    setThirdPlaceDropTarget(null);
  }

  function onThirdPlaceRowClick(target: ThirdPlaceDragPoint) {
    if (isViewer) return;
    if (thirdPlaceDragSource) return;
    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }

    if (!thirdPlaceTapSource) {
      setThirdPlaceTapSource(target);
      setThirdPlaceDropTarget(target);
      return;
    }

    if (thirdPlaceTapSource.index === target.index) {
      setThirdPlaceTapSource(null);
      setThirdPlaceDropTarget(null);
      return;
    }

    const source = thirdPlaceTapSource;
    setThirdPlaceTapSource(null);
    setThirdPlaceDropTarget(null);
    moveThirdPlace(source, target);
  }

  async function saveChanges() {
    if (isViewer) return;
    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const groupsForSave = toSavableGroups(groups);

      const res = await fetch("/api/schedule-bracket", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots, groups: groupsForSave }),
      });

      const data = (await res.json()) as { error?: string; slots?: ScheduleBracketSlot[]; groups?: ScheduleGroup[] };
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Failed to save schedule data");
      }

      if (Array.isArray(data.slots)) {
        setSlots(data.slots);
      }
      if (Array.isArray(data.groups)) {
        setGroups(normalizeGroupsForEditor(data.groups));
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save schedule data");
    } finally {
      setSaving(false);
    }
  }

  function renderSectionSaveAction() {
    return (
      <div className="schedule-editor-actions schedule-section-save-actions">
        <button
          type="button"
          className="admin-button admin-button-blue"
          onClick={saveChanges}
          disabled={saving || !isLoggedIn}
        >
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>
    );
  }

  return (
    <div className="schedule-editor-shell">
      {!isViewer && !isLoggedIn ? (
        <div className="schedule-login-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="fifa-game-login-title">
          <div className="schedule-login-modal">
            <p className="schedule-login-modal-kicker">FIFA Game</p>
            <h2 id="fifa-game-login-title" className="schedule-login-modal-title">Login to play the game</h2>
            <p className="schedule-login-modal-text">
              You can view the bracket as a guest, but you need an account to make picks, reorder teams, and save.
            </p>
            <div className="schedule-login-modal-actions">
              <button type="button" className="admin-button admin-button-blue" onClick={redirectToLogin}>
                Login
              </button>
              <button
                type="button"
                className="admin-button admin-button-ghost"
                onClick={() => router.push(registerRedirectPath)}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!isViewer ? (
      <>
      <section className="schedule-editor-top">
        <div>
          <p className="schedule-editor-help">
            {isLoggedIn
              ? isTouchDevice
                ? "Tap flags to fill groups, tap one row then another to reorder, tap winners, then save."
                : "Click flags to fill groups, drag to reorder, click bracket winners, then save."
              : "Login to fill groups, pick winners, and save your game."}
          </p>
        </div>
        <div className="schedule-editor-actions">
          <button
            type="button"
            className="admin-button admin-button-blue"
            onClick={saveChanges}
            disabled={saving || !isLoggedIn}
          >
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      </section>

      {saved ? <p className="schedule-editor-success">Your group stage and bracket picks are saved to your account.</p> : null}
      {error ? <p className="schedule-editor-error">{error}</p> : null}

      <section className="schedule-groups-wrap">
        <div className="schedule-section-head">
          <h2 className="schedule-section-title">Group Selection</h2>
        </div>
        <div className="schedule-groups-grid">
          {groups.map((group, groupIndex) => (
            <article key={group.id} className="schedule-group-card">
              <header className="schedule-group-card-head">
                <h3 className="schedule-group-card-title">{group.name}</h3>
                <div className="schedule-group-card-tools">
                  {!isViewer ? (
                    <button
                      type="button"
                      className="schedule-group-reset-button"
                      onClick={() => resetGroupSelection(groupIndex)}
                      disabled={!isLoggedIn}
                    >
                      Reset
                    </button>
                  ) : null}
                  <span className="schedule-group-head-icon" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </header>

              <div className="schedule-group-chip-row">
                {(groupCatalog[groupIndex]?.teams || []).map((team, teamIndex) => {
                  const selected = group.teams.some((rowTeam) => sameGroupTeam(rowTeam, team));
                  return (
                    <button
                      key={`${group.id}-${team.code}-${team.name}-${teamIndex}`}
                      type="button"
                      className={`schedule-group-chip schedule-group-chip-button${selected ? " schedule-group-chip-selected" : ""}`}
                      onClick={() => onGroupTeamChipClick(groupIndex, team)}
                      disabled={isViewer || !isLoggedIn}
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
                {group.teams.map((team, teamIndex) => {
                  const isDropTarget =
                    groupDropTarget?.groupIndex === groupIndex && groupDropTarget?.teamIndex === teamIndex;

                  return (
                    <div
                      key={`${group.id}-row-${teamIndex}`}
                      className={`schedule-group-row${isDropTarget ? " schedule-group-row-drop" : ""}${isLoggedIn ? " schedule-group-row-draggable" : ""}`}
                      draggable={isLoggedIn && !isTouchDevice}
                      onDragStart={(event) => onGroupTeamDragStart(event, { groupIndex, teamIndex })}
                      onDragOver={(event) => onGroupTeamDragOver(event, { groupIndex, teamIndex })}
                      onDrop={(event) => onGroupTeamDrop(event, { groupIndex, teamIndex })}
                      onDragEnd={onGroupTeamDragEnd}
                      onClick={() => onGroupTeamRowClick({ groupIndex, teamIndex })}
                    >
                      <span className="schedule-group-rank">{teamIndex + 1}</span>
                      {team.flagImageUrl ? (
                        <img src={team.flagImageUrl} alt={`${team.name} flag`} className="schedule-group-row-flag" />
                      ) : (
                        <span className="schedule-group-row-flag schedule-group-chip-flag-empty" aria-hidden="true" />
                      )}
                      <span className="schedule-group-row-name">{team.name || "-"}</span>
                      <span className="schedule-group-row-handle" aria-hidden="true">
                        ≡
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>
      {renderSectionSaveAction()}

      <ResponsiveAdSlotsBar
          maxSlots={4}
          adKeys={[
            "bf62a20e490a361287592a9c51ad8323",
            "bf62a20e490a361287592a9c51ad8323",
            "bf62a20e490a361287592a9c51ad8323",
            "bf62a20e490a361287592a9c51ad8323",
          ]}
          mobileAdKeys={[
            "bf62a20e490a361287592a9c51ad8323",
          ]}
      />

      <section className="schedule-third-place-wrap">
        <div className="schedule-section-head schedule-third-place-head">
          <h2 className="schedule-section-title schedule-third-place-kicker">Third Place Selection</h2>
          <p className="schedule-third-place-help">Rank all 12 third-place teams. The top 8 fill the bracket automatically.</p>
        </div>
        <article className="schedule-group-card schedule-third-place-single">
          <header className="schedule-group-card-head">
            <h3 className="schedule-third-place-title">Top 8 Qualify</h3>
          </header>
          <div className="schedule-group-table">
            {thirdPlaceOrder.map((groupId, index) => {
              const candidate = thirdPlaceCandidates.find((item) => item.groupId === groupId);
              if (!candidate) return null;

              const isQualified = index < THIRD_PLACE_SLOT_IDS.length;
              const bracketSlotId = THIRD_PLACE_SLOT_IDS[index];
              const bracketSlot = bracketSlotId ? slotMap.get(bracketSlotId) : null;
              const isDropTarget = thirdPlaceDropTarget?.index === index;

              return (
                <div
                  key={`third-place-rank-${groupId}`}
                  className={`schedule-group-row schedule-third-place-row${isQualified ? " schedule-third-place-row-selected" : ""}${isDropTarget ? " schedule-group-row-drop" : ""}${isLoggedIn ? " schedule-group-row-draggable" : ""}`}
                  draggable={isLoggedIn && !isTouchDevice}
                  onDragStart={(event) => onThirdPlaceDragStart(event, { index })}
                  onDragOver={(event) => onThirdPlaceDragOver(event, { index })}
                  onDrop={(event) => onThirdPlaceDrop(event, { index })}
                  onDragEnd={onThirdPlaceDragEnd}
                  onClick={() => onThirdPlaceRowClick({ index })}
                >
                  <span className="schedule-group-rank">{index + 1}</span>
                  {candidate.flagImageUrl ? (
                    <img src={candidate.flagImageUrl} alt={`${candidate.name} flag`} className="schedule-group-row-flag" />
                  ) : (
                    <span className="schedule-group-row-flag schedule-group-chip-flag-empty" aria-hidden="true" />
                  )}
                  <span className="schedule-group-row-name">{candidate.name}</span>
                  <span className="schedule-group-row-handle" aria-hidden="true">
                    {isQualified ? (bracketSlot?.code || "Q") : "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </article>
      </section>
      {renderSectionSaveAction()}
      </>
      ) : null}

      <ResponsiveAdSlotsBar
          maxSlots={4}
          adKeys={[
            "bf62a20e490a361287592a9c51ad8323",
            "bf62a20e490a361287592a9c51ad8323",
            "bf62a20e490a361287592a9c51ad8323",
            "bf62a20e490a361287592a9c51ad8323",
          ]}
          mobileAdKeys={[
            "bf62a20e490a361287592a9c51ad8323",
          ]}
      />

      <section className="schedule-bracket-wrap schedule-bracket-wrap-full">
        <div className="schedule-section-head schedule-bracket-head">
          <h2 className="schedule-section-title">{isViewer ? "FIFA 2026 Schedule" : "Bracket"}</h2>
          <p className="schedule-bracket-guide">
            {isViewer ? "Official FIFA 2026 knockout schedule." : "Click a team in each match to move it forward."}
          </p>
        </div>
        <div ref={bracketScrollerRef} className="schedule-bracket-scroller">
          <div className="schedule-bracket-canvas" style={{ width: `${canvasWidth}px`, height: `${CANVAS_HEIGHT}px` }}>
            <div className="schedule-stage-header">
              {STAGE_HEADERS.map((header, index) => (
                <div
                  key={`${header.label}-${header.x}`}
                  className={`schedule-stage-name${index >= 4 ? " schedule-stage-name-right" : ""}`}
                  style={{ left: `${header.x * widthScale}px`, width: `${cardWidth}px` }}
                >
                  {header.label}
                </div>
              ))}
            </div>

            <svg className="schedule-bracket-lines" viewBox={`0 0 ${canvasWidth} ${CANVAS_HEIGHT}`} aria-hidden="true">
              {CONNECTIONS.map((connection, index) => {
                const from = byId.get(connection.from);
                const to = byId.get(connection.to);
                if (!from || !to) return null;

                const fromCenterY = from.y + CARD_HEIGHT / 2;
                const toCenterY = to.y + CARD_HEIGHT / 2;

                if (to.x > from.x) {
                  const startX = from.x + cardWidth;
                  const endX = to.x;
                  const midX = startX + (endX - startX) / 2;
                  return (
                    <path
                      key={`${connection.from}-${connection.to}-${index}`}
                      d={`M ${startX} ${fromCenterY} H ${midX} V ${toCenterY} H ${endX}`}
                    />
                  );
                }

                const startX = from.x;
                const endX = to.x + cardWidth;
                const midX = endX + (startX - endX) / 2;
                return (
                  <path
                    key={`${connection.from}-${connection.to}-${index}`}
                    d={`M ${startX} ${fromCenterY} H ${midX} V ${toCenterY} H ${endX}`}
                  />
                );
              })}
            </svg>

            {positioned.map((match) => {
              const outcome = MATCH_OUTCOMES[match.id];
              const hasOutcome = !isViewer && Boolean(outcome);
              const selectedWinnerId = winnerByMatch[match.id];
              const teamA = slotMap.get(match.slotA) || { id: match.slotA, code: "", name: "TBD", flagImageUrl: "" };
              const teamB = slotMap.get(match.slotB) || { id: match.slotB, code: "", name: "TBD", flagImageUrl: "" };

              return (
                <article
                  key={match.id}
                  ref={(element) => {
                    matchCardRefs.current[match.id] = element;
                  }}
                  className={`schedule-match-card schedule-match-card-${match.side}`}
                  style={{ left: `${match.x}px`, top: `${match.y}px`, width: `${cardWidth}px` }}
                  tabIndex={-1}
                  onClick={() => centerMatchCardInView(match.id)}
                >
                  {match.title ? <p className="schedule-match-title">{match.title}</p> : null}
                  <div className="schedule-match-id">{match.id}</div>
                  <div className="schedule-match-body">
                    <div className="schedule-match-datetime">
                      <span>{match.date}</span>
                      <span>{match.time}</span>
                    </div>
                    <div className="schedule-team-stack">
                      <div
                        className={[
                          "schedule-team-row",
                          hasOutcome ? "schedule-team-row-clickable" : "",
                          selectedWinnerId === match.slotA ? "schedule-team-row-selected" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        role={hasOutcome ? "button" : undefined}
                        tabIndex={hasOutcome ? 0 : undefined}
                        aria-pressed={hasOutcome ? selectedWinnerId === match.slotA : undefined}
                        onClick={hasOutcome ? () => applyMatchWinner(match, match.slotA) : undefined}
                        onKeyDown={hasOutcome ? (event) => onTeamRowKeyDown(event, match, match.slotA) : undefined}
                      >
                        <span className="schedule-slot-chip">{teamA.code || `#${teamA.id}`}</span>
                        {teamA.flagImageUrl ? (
                          <img src={teamA.flagImageUrl} alt={`${teamA.name} flag`} className="schedule-team-flag" />
                        ) : (
                          <span className="schedule-team-flag schedule-team-flag-empty" aria-hidden="true" />
                        )}
                        <span className="schedule-team-name">{teamA.name || "TBD"}</span>
                        <span className="schedule-team-id">#{teamA.id}</span>
                      </div>
                      <div
                        className={[
                          "schedule-team-row",
                          hasOutcome ? "schedule-team-row-clickable" : "",
                          selectedWinnerId === match.slotB ? "schedule-team-row-selected" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        role={hasOutcome ? "button" : undefined}
                        tabIndex={hasOutcome ? 0 : undefined}
                        aria-pressed={hasOutcome ? selectedWinnerId === match.slotB : undefined}
                        onClick={hasOutcome ? () => applyMatchWinner(match, match.slotB) : undefined}
                        onKeyDown={hasOutcome ? (event) => onTeamRowKeyDown(event, match, match.slotB) : undefined}
                      >
                        <span className="schedule-slot-chip">{teamB.code || `#${teamB.id}`}</span>
                        {teamB.flagImageUrl ? (
                          <img src={teamB.flagImageUrl} alt={`${teamB.name} flag`} className="schedule-team-flag" />
                        ) : (
                          <span className="schedule-team-flag schedule-team-flag-empty" aria-hidden="true" />
                        )}
                        <span className="schedule-team-name">{teamB.name || "TBD"}</span>
                        <span className="schedule-team-id">#{teamB.id}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      {!isViewer ? renderSectionSaveAction() : null}
    </div>
  );
}
