import { prisma } from "@/lib/prisma";

/** Данные серии для карточки матча (отдельный запрос — не используем `include` на Match для совместимости с клиентом Prisma). */
export async function loadPlayoffSeriesForMatchDetail(playoffSeriesId: string | null) {
  if (!playoffSeriesId) return null;
  return prisma.playoffSeries.findUnique({
    where: { id: playoffSeriesId },
    include: {
      teamA: { select: { id: true, name: true } },
      teamB: { select: { id: true, name: true } },
      matches: {
        where: { archivedAt: null },
        select: {
          status: true,
          archivedAt: true,
          homeTeamId: true,
          awayTeamId: true,
          homeScore: true,
          awayScore: true,
        },
      },
    },
  });
}

/** Пересчитывает счёт побед в серии и при необходимости выставляет победителя серии. */
export async function recalculatePlayoffSeries(seriesId: string) {
  const series = await prisma.playoffSeries.findUnique({
    where: { id: seriesId },
    include: {
      matches: {
        where: { status: "FINISHED", archivedAt: null },
        select: {
          homeTeamId: true,
          awayTeamId: true,
          homeScore: true,
          awayScore: true,
        },
      },
    },
  });
  if (!series) return;
  if (series.winnerDeterminedManually) return;

  let winsA = 0;
  let winsB = 0;
  for (const m of series.matches) {
    if (m.homeScore == null || m.awayScore == null) continue;
    if (m.homeScore === m.awayScore) continue;
    const winnerId =
      m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
    if (winnerId === series.teamAId) winsA++;
    else if (winnerId === series.teamBId) winsB++;
  }

  let winnerTeamId: string | null = null;
  if (winsA >= series.winsToWin) winnerTeamId = series.teamAId;
  else if (winsB >= series.winsToWin) winnerTeamId = series.teamBId;

  await prisma.playoffSeries.update({
    where: { id: seriesId },
    data: { winnerTeamId },
  });
}

export type SeriesScore = {
  winsA: number;
  winsB: number;
  winsToWin: number;
  winnerTeamId: string | null;
  teamAId: string;
  teamBId: string;
};

export function computeSeriesScore(
  series: {
    teamAId: string;
    teamBId: string;
    winsToWin: number;
    winnerTeamId: string | null;
    winnerDeterminedManually?: boolean | null;
    matches: Array<{
      status: string;
      archivedAt: Date | null;
      homeTeamId: string;
      awayTeamId: string;
      homeScore: number | null;
      awayScore: number | null;
    }>;
  }
): SeriesScore {
  let winsA = 0;
  let winsB = 0;
  for (const m of series.matches) {
    if (m.status !== "FINISHED" || m.archivedAt) continue;
    if (m.homeScore == null || m.awayScore == null) continue;
    if (m.homeScore === m.awayScore) continue;
    const winnerId =
      m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
    if (winnerId === series.teamAId) winsA++;
    else if (winnerId === series.teamBId) winsB++;
  }

  let winnerTeamId: string | null = null;
  if (series.winnerDeterminedManually) {
    winnerTeamId = series.winnerTeamId;
  } else {
    if (winsA >= series.winsToWin) winnerTeamId = series.teamAId;
    else if (winsB >= series.winsToWin) winnerTeamId = series.teamBId;
    winnerTeamId = winnerTeamId ?? series.winnerTeamId;
  }

  return {
    teamAId: series.teamAId,
    teamBId: series.teamBId,
    winsA,
    winsB,
    winsToWin: series.winsToWin,
    winnerTeamId,
  };
}
