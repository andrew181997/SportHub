"use server";

import { requireLeagueContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/** Форма на странице турнира: возвращает только void (требование типов для Server Actions). */
export async function updatePlayoffSeriesBracket(formData: FormData): Promise<void> {
  const league = await requireLeagueContext();
  const seriesId = String(formData.get("seriesId") ?? "").trim();
  const colRaw = formData.get("bracketColumn");
  const rowRaw = formData.get("bracketRow");

  const bracketColumn =
    colRaw === "" || colRaw == null ? 0 : Number(colRaw);
  const bracketRow =
    rowRaw === "" || rowRaw == null ? 0 : Number(rowRaw);

  if (!Number.isFinite(bracketColumn) || bracketColumn < 0 || bracketColumn > 32) {
    return;
  }
  if (!Number.isFinite(bracketRow) || bracketRow < 0 || bracketRow > 127) {
    return;
  }

  const series = await prisma.playoffSeries.findFirst({
    where: { id: seriesId, tournament: { leagueId: league.id } },
    select: { id: true, tournamentId: true },
  });
  if (!series) {
    return;
  }

  await prisma.playoffSeries.update({
    where: { id: seriesId },
    data: { bracketColumn, bracketRow } as object,
  });

  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${series.tournamentId}`);
  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${series.tournamentId}`);
  revalidatePath("/standings");
}
