"use server";

import { requireLeagueContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { recalculatePlayoffSeries } from "@/lib/playoff-series";

function revalidatePlayoff(seriesTournamentId: string) {
  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${seriesTournamentId}`);
  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${seriesTournamentId}`);
  revalidatePath("/standings");
  revalidatePath("/admin/matches");
  revalidatePath("/results");
}

/** Ручной итог серии: победитель или сброс (включить снова автопересчёт по матчам). */
export async function setPlayoffSeriesManualResult(formData: FormData): Promise<void> {
  const league = await requireLeagueContext();
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const outcome = String(formData.get("outcome") ?? "").trim();

  const series = await prisma.playoffSeries.findFirst({
    where: { id: seriesId, tournament: { leagueId: league.id } },
    select: {
      id: true,
      tournamentId: true,
      teamAId: true,
      teamBId: true,
    },
  });
  if (!series) return;

  if (outcome === "clear") {
    await prisma.playoffSeries.update({
      where: { id: series.id },
      data: {
        winnerTeamId: null,
        winnerDeterminedManually: false,
      },
    });
    await recalculatePlayoffSeries(series.id);
    revalidatePlayoff(series.tournamentId);
    return;
  }

  if (outcome === "teamA") {
    await prisma.playoffSeries.update({
      where: { id: series.id },
      data: {
        winnerTeamId: series.teamAId,
        winnerDeterminedManually: true,
      },
    });
    revalidatePlayoff(series.tournamentId);
    return;
  }

  if (outcome === "teamB") {
    await prisma.playoffSeries.update({
      where: { id: series.id },
      data: {
        winnerTeamId: series.teamBId,
        winnerDeterminedManually: true,
      },
    });
    revalidatePlayoff(series.tournamentId);
    return;
  }
}

/** Снять ручную фиксацию и выставить победителя по завершённым матчам. */
export async function resyncPlayoffSeriesWinnerFromMatches(
  formData: FormData
): Promise<void> {
  const league = await requireLeagueContext();
  const seriesId = String(formData.get("seriesId") ?? "").trim();

  const series = await prisma.playoffSeries.findFirst({
    where: { id: seriesId, tournament: { leagueId: league.id } },
    select: { id: true, tournamentId: true },
  });
  if (!series) return;

  await prisma.playoffSeries.update({
    where: { id: series.id },
    data: { winnerDeterminedManually: false },
  });
  await recalculatePlayoffSeries(series.id);
  revalidatePlayoff(series.tournamentId);
}
