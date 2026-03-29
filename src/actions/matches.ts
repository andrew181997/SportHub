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
import { z } from "zod/v4";

const protocolBundleSchema = z.object({
  homeScore: z.coerce.number().min(0),
  awayScore: z.coerce.number().min(0),
  overtime: z.boolean(),
  shootout: z.boolean(),
  events: z.array(matchEventSchema),
  penalties: z.array(penaltySchema),
  goalieStats: z.array(
    z.object({
      playerId: z.string().min(1),
      teamId: z.string().min(1),
      saves: z.coerce.number().min(0),
      goalsAgainst: z.coerce.number().min(0),
      shutout: z.boolean(),
    })
  ),
});

export type MatchProtocolBundle = z.infer<typeof protocolBundleSchema>;

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

/** Полная замена протокола и счёта (новый матч или правка завершённого). */
export async function replaceMatchProtocol(
  matchId: string,
  bundle: MatchProtocolBundle
) {
  const league = await requireLeagueContext();
  const parsed = protocolBundleSchema.safeParse(bundle);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const match = await prisma.match.findFirst({
    where: { id: matchId, leagueId: league.id },
    select: {
      id: true,
      tournamentId: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });
  if (!match) {
    return { error: "Матч не найден" };
  }

  const teamIds = new Set([match.homeTeamId, match.awayTeamId]);
  for (const e of parsed.data.events) {
    if (!teamIds.has(e.teamId)) {
      return { error: "Событие: неверная команда" };
    }
  }
  for (const p of parsed.data.penalties) {
    if (!teamIds.has(p.teamId)) {
      return { error: "Штраф: неверная команда" };
    }
  }
  for (const g of parsed.data.goalieStats) {
    if (!teamIds.has(g.teamId)) {
      return { error: "Вратарь: неверная команда" };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        homeScore: parsed.data.homeScore,
        awayScore: parsed.data.awayScore,
        overtime: parsed.data.overtime,
        shootout: parsed.data.shootout,
        status: "FINISHED",
      },
    });
    await tx.matchEvent.deleteMany({ where: { matchId } });
    await tx.penalty.deleteMany({ where: { matchId } });
    await tx.goalieStats.deleteMany({ where: { matchId } });

    if (parsed.data.events.length > 0) {
      await tx.matchEvent.createMany({
        data: parsed.data.events.map((e) => ({ ...e, matchId })),
      });
    }
    if (parsed.data.penalties.length > 0) {
      await tx.penalty.createMany({
        data: parsed.data.penalties.map((p) => ({ ...p, matchId })),
      });
    }
    if (parsed.data.goalieStats.length > 0) {
      await tx.goalieStats.createMany({
        data: parsed.data.goalieStats.map((g) => ({ ...g, matchId })),
      });
    }
  });

  await recalculateStandings(match.tournamentId);

  revalidatePath("/admin/matches");
  revalidatePath(`/admin/matches/${matchId}`);
  revalidatePath("/standings");
  revalidatePath("/results");
  revalidatePath("/calendar");
  revalidatePath(`/matches/${matchId}`);
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
