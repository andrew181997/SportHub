"use server";

import { prisma } from "@/lib/prisma";
import { requireLeagueContext } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

function revalidateTournamentPaths(tournamentId: string) {
  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath("/admin/teams");
  revalidatePath("/standings");
  revalidatePath("/tournaments");
}

export async function addTeamToTournament(tournamentId: string, teamId: string) {
  const league = await requireLeagueContext();

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, leagueId: league.id },
  });
  if (!tournament || tournament.archivedAt) {
    return { error: "Турнир не найден или в архиве." };
  }

  const team = await prisma.team.findFirst({
    where: { id: teamId, leagueId: league.id, archivedAt: null },
  });
  if (!team) {
    return { error: "Команда не найдена." };
  }

  const existing = await prisma.standing.findUnique({
    where: { teamId_tournamentId: { teamId, tournamentId } },
  });
  if (!existing) {
    await prisma.standing.create({
      data: {
        teamId,
        tournamentId,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        overtimeWins: 0,
        overtimeLosses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      },
    });
  }

  revalidateTournamentPaths(tournamentId);
  return { success: true as const };
}

export async function removeTeamFromTournament(tournamentId: string, teamId: string) {
  const league = await requireLeagueContext();

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, leagueId: league.id },
  });
  if (!tournament) {
    return { error: "Турнир не найден." };
  }

  const matches = await prisma.match.count({
    where: {
      tournamentId,
      archivedAt: null,
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
  });
  if (matches > 0) {
    return {
      error: "Нельзя убрать команду: для неё уже есть матчи в этом турнире.",
    };
  }

  await prisma.standing.deleteMany({
    where: { tournamentId, teamId },
  });

  revalidateTournamentPaths(tournamentId);
  return { success: true as const };
}
