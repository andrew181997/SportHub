"use server";

import { prisma } from "@/lib/prisma";
import { tournamentSchema, seasonSchema } from "@/lib/validations/league";
import { requireLeagueContext } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

export async function createSeason(formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = seasonSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  await prisma.season.create({
    data: { ...parsed.data, leagueId: league.id },
  });

  revalidatePath("/admin/tournaments");
  return { success: true };
}

export async function createTournament(formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = tournamentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  await prisma.tournament.create({
    data: { ...parsed.data, leagueId: league.id },
  });

  revalidatePath("/admin/tournaments");
  return { success: true };
}

export async function updateTournament(id: string, formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = tournamentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  await prisma.tournament.update({
    where: { id, leagueId: league.id },
    data: parsed.data,
  });

  revalidatePath("/admin/tournaments");
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
