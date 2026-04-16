"use server";

import { prisma } from "@/lib/prisma";
import { tournamentSchema } from "@/lib/validations/league";
import { ensureDefaultSeason } from "@/lib/default-season";
import { requireLeagueContext } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

export async function createTournament(formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = tournamentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const season = await ensureDefaultSeason(league.id);

  const tournament = await prisma.tournament.create({
    data: {
      name: parsed.data.name,
      emblem: parsed.data.emblem,
      type: parsed.data.type,
      playoffPairing:
        parsed.data.type === "PLAYOFF" ? parsed.data.playoffPairing : null,
      seriesWinsToWin:
        parsed.data.type === "PLAYOFF" ? parsed.data.seriesWinsToWin : null,
      leagueId: league.id,
      seasonId: season.id,
    },
  });

  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${tournament.id}`);
  return { success: true as const, id: tournament.id };
}

export async function updateTournament(id: string, formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = tournamentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  await prisma.tournament.update({
    where: { id, leagueId: league.id },
    data: {
      name: parsed.data.name,
      emblem: parsed.data.emblem,
      type: parsed.data.type,
      playoffPairing:
        parsed.data.type === "PLAYOFF" ? parsed.data.playoffPairing : null,
      seriesWinsToWin:
        parsed.data.type === "PLAYOFF" ? parsed.data.seriesWinsToWin : null,
    },
  });

  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${id}`);
  return { success: true };
}

export async function archiveTournament(tournamentId: string) {
  const league = await requireLeagueContext();
  const now = new Date();

  await prisma.$transaction([
    prisma.tournament.update({
      where: { id: tournamentId, leagueId: league.id },
      data: { archivedAt: now },
    }),
    prisma.group.updateMany({
      where: { tournamentId },
      data: { archivedAt: now },
    }),
    prisma.match.updateMany({
      where: { tournamentId },
      data: { archivedAt: now },
    }),
  ]);

  revalidatePath("/admin/tournaments");
  return { success: true };
}

export async function restoreTournament(tournamentId: string) {
  const league = await requireLeagueContext();

  await prisma.$transaction([
    prisma.tournament.update({
      where: { id: tournamentId, leagueId: league.id },
      data: { archivedAt: null },
    }),
    prisma.group.updateMany({
      where: { tournamentId },
      data: { archivedAt: null },
    }),
    prisma.match.updateMany({
      where: { tournamentId },
      data: { archivedAt: null },
    }),
  ]);

  revalidatePath("/admin/tournaments");
  return { success: true };
}

export async function createGroup(tournamentId: string, name: string) {
  await requireLeagueContext();

  await prisma.group.create({
    data: { name, tournamentId },
  });

  revalidatePath("/admin/tournaments");
  return { success: true };
}
