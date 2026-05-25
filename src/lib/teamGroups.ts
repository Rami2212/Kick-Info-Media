export const TEAM_GROUPS = [
  "Group A",
  "Group B",
  "Group C",
  "Group D",
  "Group E",
  "Group F",
  "Group G",
  "Group H",
  "Group I",
  "Group J",
  "Group K",
  "Group L",
] as const;

export type TeamGroup = (typeof TEAM_GROUPS)[number];

