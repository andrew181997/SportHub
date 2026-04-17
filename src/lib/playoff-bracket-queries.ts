import { prisma } from "@/lib/prisma";
import type { PlayoffSeriesDbRow } from "@/lib/playoff-bracket-display";

const MATCH_SELECT = {
  where: { archivedAt: null },
  select: {
    status: true,
    archivedAt: true,
    homeTeamId: true,
    awayTeamId: true,
    homeScore: true,
    awayScore: true,
  },
} as const;

const SERIES_INCLUDE = {
  teamA: { select: { id: true, name: true } },
  teamB: { select: { id: true, name: true } },
  matches: MATCH_SELECT,
} as const;

/**
 * Запрос серий для сетки. `as any` убирается после успешного `pnpm prisma generate`,
 * когда клиент Prisma содержит поля `bracketColumn` / `bracketRow`.
 */
export async function loadPlayoffSeriesRowsForTournament(tournamentId: string) {
  const rows = await prisma.playoffSeries.findMany({
    where: { tournamentId },
    orderBy: [{ bracketColumn: "asc" }, { bracketRow: "asc" }],
    include: SERIES_INCLUDE,
  } as any);
  return rows as unknown as PlayoffSeriesDbRow[];
}

export async function loadPlayoffSeriesRowsForTournaments(tournamentIds: string[]) {
  if (tournamentIds.length === 0) return [];
  const rows = await prisma.playoffSeries.findMany({
    where: { tournamentId: { in: tournamentIds } },
    orderBy: [{ bracketColumn: "asc" }, { bracketRow: "asc" }],
    include: SERIES_INCLUDE,
  } as any);
  return rows as unknown as PlayoffSeriesDbRow[];
}
