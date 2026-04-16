"use server";

import { prisma } from "@/lib/prisma";
import { teamSchema } from "@/lib/validations/league";
import { requireLeagueContext } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

const zeroStanding = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  overtimeWins: 0,
  overtimeLosses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
} as const;

export async function createTeam(formData: FormData) {
  const league = await requireLeagueContext();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const tournamentId = raw.tournamentId?.trim() || undefined;
  const { tournamentId: _t, ...teamFields } = raw;
  const parsed = teamSchema.safeParse(teamFields);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  if (tournamentId) {
    const tournament = await prisma.tournament.findFirst({
      where: { id: tournamentId, leagueId: league.id, archivedAt: null },
    });
    if (!tournament) {
      return { error: "Турнир не найден или в архиве." };
    }
  }

  await prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: { ...parsed.data, leagueId: league.id },
    });
    if (tournamentId) {
      const dup = await tx.standing.findUnique({
        where: {
          teamId_tournamentId: { teamId: team.id, tournamentId },
        },
      });
      if (!dup) {
        await tx.standing.create({
          data: {
            teamId: team.id,
            tournamentId,
            ...zeroStanding,
          },
        });
      }
    }
  });

  revalidatePath("/admin/teams");
  revalidatePath("/admin/tournaments");
  revalidatePath("/standings");
  revalidatePath("/teams");
  return { success: true };
}

export async function updateTeam(id: string, formData: FormData) {
  const league = await requireLeagueContext();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = teamSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const logoCleared = raw.logo == null || String(raw.logo).trim() === "";

  await prisma.team.update({
    where: { id, leagueId: league.id },
    data: {
      ...parsed.data,
      logo: logoCleared ? null : (parsed.data.logo ?? null),
    },
  });

  revalidatePath("/admin/teams");
  revalidatePath("/teams");
  revalidatePath(`/teams/${id}`);
  return { success: true };
}

export async function archiveTeam(teamId: string) {
  const league = await requireLeagueContext();

  await prisma.team.update({
    where: { id: teamId, leagueId: league.id },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/admin/teams");
  return { success: true };
}

export async function restoreTeam(teamId: string) {
  const league = await requireLeagueContext();

  await prisma.team.update({
    where: { id: teamId, leagueId: league.id },
    data: { archivedAt: null },
  });

  revalidatePath("/admin/teams");
  return { success: true };
}
