import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const STAT_SORT_OPTIONS = [
  { value: "goals", label: "Голы" },
  { value: "assists", label: "Передачи" },
  { value: "points", label: "Очки (голы + передачи)" },
  { value: "penalty_minutes", label: "Штрафные минуты" },
  { value: "saves", label: "Сэйвы (вратари)" },
  { value: "goals_against", label: "Пропущено (вратари)" },
] as const;

export type StatSortBy = (typeof STAT_SORT_OPTIONS)[number]["value"];

function matchFilter(
  leagueId: string,
  tournamentId: string | undefined
): Prisma.MatchWhereInput {
  return {
    leagueId,
    status: "FINISHED",
    archivedAt: null,
    ...(tournamentId ? { tournamentId } : {}),
  };
}

export type LeagueStatRow = {
  playerId: string;
  lastName: string;
  firstName: string;
  middleName: string | null;
  teamName: string | null;
  goals: number;
  assists: number;
  penaltyMinutes: number;
  saves: number;
  goalsAgainst: number;
  points: number;
};

function sortValue(row: LeagueStatRow, by: StatSortBy): number {
  switch (by) {
    case "goals":
      return row.goals;
    case "assists":
      return row.assists;
    case "points":
      return row.points;
    case "penalty_minutes":
      return row.penaltyMinutes;
    case "saves":
      return row.saves;
    case "goals_against":
      return row.goalsAgainst;
    default:
      return row.goals;
  }
}

export async function getLeagueStatistics(
  leagueId: string,
  tournamentId: string | undefined,
  sortBy: StatSortBy
): Promise<LeagueStatRow[]> {
  const mWhere = matchFilter(leagueId, tournamentId);

  const [goalGroups, assistGroups, penaltyGroups, goalieGroups] = await Promise.all([
    prisma.matchEvent.groupBy({
      by: ["playerId"],
      where: { type: "GOAL", match: mWhere },
      _count: { _all: true },
    }),
    prisma.matchEvent.groupBy({
      by: ["playerId"],
      where: { type: "ASSIST", match: mWhere },
      _count: { _all: true },
    }),
    prisma.penalty.groupBy({
      by: ["playerId"],
      where: { match: mWhere },
      _sum: { minutes: true },
    }),
    prisma.goalieStats.groupBy({
      by: ["playerId"],
      where: { match: mWhere },
      _sum: { saves: true, goalsAgainst: true },
    }),
  ]);

  const idSet = new Set<string>();
  for (const g of goalGroups) idSet.add(g.playerId);
  for (const g of assistGroups) idSet.add(g.playerId);
  for (const g of penaltyGroups) idSet.add(g.playerId);
  for (const g of goalieGroups) idSet.add(g.playerId);

  if (idSet.size === 0) return [];

  const players = await prisma.player.findMany({
    where: { id: { in: [...idSet] }, leagueId, archivedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      middleName: true,
      rosters: {
        take: 1,
        orderBy: { season: { startDate: "desc" } },
        select: { team: { select: { name: true } } },
      },
    },
  });

  const goalsMap = new Map(goalGroups.map((g) => [g.playerId, g._count._all]));
  const assistsMap = new Map(assistGroups.map((g) => [g.playerId, g._count._all]));
  const penMap = new Map(
    penaltyGroups.map((g) => [g.playerId, g._sum.minutes ?? 0])
  );
  const goalieMap = new Map(
    goalieGroups.map((g) => [
      g.playerId,
      { saves: g._sum.saves ?? 0, ga: g._sum.goalsAgainst ?? 0 },
    ])
  );

  const rows: LeagueStatRow[] = players.map((p) => {
    const goals = goalsMap.get(p.id) ?? 0;
    const assists = assistsMap.get(p.id) ?? 0;
    const g = goalieMap.get(p.id);
    return {
      playerId: p.id,
      lastName: p.lastName,
      firstName: p.firstName,
      middleName: p.middleName,
      teamName: p.rosters[0]?.team.name ?? null,
      goals,
      assists,
      penaltyMinutes: penMap.get(p.id) ?? 0,
      saves: g?.saves ?? 0,
      goalsAgainst: g?.ga ?? 0,
      points: goals + assists,
    };
  });

  rows.sort((a, b) => {
    const va = sortValue(a, sortBy);
    const vb = sortValue(b, sortBy);
    if (vb !== va) return vb - va;
    const na = `${a.lastName} ${a.firstName}`;
    const nb = `${b.lastName} ${b.firstName}`;
    return na.localeCompare(nb, "ru");
  });

  return rows;
}

export function isStatSortBy(v: string | undefined): v is StatSortBy {
  return STAT_SORT_OPTIONS.some((o) => o.value === v);
}
