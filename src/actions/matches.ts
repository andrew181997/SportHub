"use server";

import { prisma } from "@/lib/prisma";
import {
  matchSchema,
  matchResultSchema,
  matchEventSchema,
  penaltySchema,
} from "@/lib/validations/league";
import { requireLeagueContext } from "@/lib/tenant";
import { recalculateStandings } from "@/lib/standings";
import { revalidatePath } from "next/cache";

export async function createMatch(formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = matchSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  if (parsed.data.homeTeamId === parsed.data.awayTeamId) {
    return { error: "Команда не может играть сама с собой" };
  }

  await prisma.match.create({
    data: { ...parsed.data, leagueId: league.id },
  });

  revalidatePath("/admin/matches");
  return { success: true };
}

export async function updateMatchResult(matchId: string, formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = matchResultSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const match = await prisma.match.update({
    where: { id: matchId, leagueId: league.id },
    data: {
      ...parsed.data,
      status: "FINISHED",
    },
  });

  await recalculateStandings(match.tournamentId);

  revalidatePath("/admin/matches");
  revalidatePath("/standings");
  revalidatePath("/results");
  return { success: true };
}

export async function addMatchEvent(matchId: string, formData: FormData) {
  await requireLeagueContext();
  const parsed = matchEventSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  await prisma.matchEvent.create({
    data: { ...parsed.data, matchId },
  });

  revalidatePath(`/admin/matches`);
  return { success: true };
}

export async function addPenalty(matchId: string, formData: FormData) {
  await requireLeagueContext();
  const parsed = penaltySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  await prisma.penalty.create({
    data: { ...parsed.data, matchId },
  });

  revalidatePath(`/admin/matches`);
  return { success: true };
}

export async function saveGoalieStats(
  matchId: string,
  data: {
    playerId: string;
    teamId: string;
    saves: number;
    goalsAgainst: number;
    shutout: boolean;
  }
) {
  await requireLeagueContext();

  await prisma.goalieStats.upsert({
    where: { matchId_playerId: { matchId, playerId: data.playerId } },
    create: { matchId, ...data },
    update: {
      saves: data.saves,
      goalsAgainst: data.goalsAgainst,
      shutout: data.shutout,
    },
  });

  revalidatePath(`/admin/matches`);
  return { success: true };
}

export async function updateMatchStatus(
  matchId: string,
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED"
) {
  const league = await requireLeagueContext();

  await prisma.match.update({
    where: { id: matchId, leagueId: league.id },
    data: { status },
  });

  revalidatePath("/admin/matches");
  revalidatePath("/calendar");
  return { success: true };
}
