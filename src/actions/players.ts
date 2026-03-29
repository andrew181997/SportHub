"use server";

import { prisma } from "@/lib/prisma";
import { playerSchema } from "@/lib/validations/league";
import { requireLeagueContext } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

export async function createPlayer(formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = playerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  await prisma.player.create({
    data: { ...parsed.data, leagueId: league.id },
  });

  revalidatePath("/admin/players");
  return { success: true };
}

export async function updatePlayer(id: string, formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = playerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  await prisma.player.update({
    where: { id, leagueId: league.id },
    data: parsed.data,
  });

  revalidatePath("/admin/players");
  return { success: true };
}

export async function archivePlayer(playerId: string) {
  const league = await requireLeagueContext();

  await prisma.player.update({
    where: { id: playerId, leagueId: league.id },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/admin/players");
  return { success: true };
}

export async function assignPlayerToRoster(data: {
  playerId: string;
  teamId: string;
  seasonId: string;
  number?: number;
  position?: string;
  isCaptain?: boolean;
}) {
  await requireLeagueContext();

  await prisma.teamRoster.upsert({
    where: {
      teamId_playerId_seasonId: {
        teamId: data.teamId,
        playerId: data.playerId,
        seasonId: data.seasonId,
      },
    },
    create: data,
    update: {
      number: data.number,
      position: data.position,
      isCaptain: data.isCaptain,
    },
  });

  revalidatePath("/admin/players");
  return { success: true };
}

export async function removePlayerFromRoster(
  playerId: string,
  teamId: string,
  seasonId: string
) {
  await requireLeagueContext();

  await prisma.teamRoster.delete({
    where: {
      teamId_playerId_seasonId: { teamId, playerId, seasonId },
    },
  });

  revalidatePath("/admin/players");
  return { success: true };
}
