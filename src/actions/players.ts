"use server";

import type { PlayerRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { playerSchema } from "@/lib/validations/league";
import { normalizePlayerRole } from "@/lib/player-role";
import { requireLeagueContext } from "@/lib/tenant";
import { ensureDefaultSeason } from "@/lib/default-season";
import { revalidatePath } from "next/cache";

type PlayerWriteBody = {
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate?: Date;
  role: PlayerRole;
};

function toPlayerWriteBody(parsed: {
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate?: Date;
  role: PlayerRole;
}): { ok: true; data: PlayerWriteBody } | { ok: false; error: string } {
  const role = normalizePlayerRole(parsed.role);
  if (!role) {
    return { ok: false, error: "Недопустимое амплуа. Выберите позицию из списка." };
  }
  const middle =
    parsed.middleName == null || parsed.middleName.trim() === ""
      ? undefined
      : parsed.middleName.trim();
  return {
    ok: true,
    data: {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      middleName: middle,
      birthDate: parsed.birthDate,
      role,
    },
  };
}

export async function createPlayer(formData: FormData) {
  const league = await requireLeagueContext();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const teamId = raw.teamId?.trim() || undefined;
  const { teamId: _t, seasonId: _s, ...playerFields } = raw;
  const parsed = playerSchema.safeParse(playerFields);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const body = toPlayerWriteBody(parsed.data);
  if (!body.ok) {
    return { error: body.error };
  }

  let rosterSeasonId: string | undefined;
  if (teamId) {
    const team = await prisma.team.findFirst({
      where: { id: teamId, leagueId: league.id, archivedAt: null },
    });
    if (!team) {
      return { error: "Команда не найдена в этой лиге." };
    }
    const season = await ensureDefaultSeason(league.id);
    rosterSeasonId = season.id;
  }

  await prisma.$transaction(async (tx) => {
    const player = await tx.player.create({
      data: { ...body.data, leagueId: league.id },
    });
    if (teamId && rosterSeasonId) {
      await tx.teamRoster.create({
        data: {
          teamId,
          playerId: player.id,
          seasonId: rosterSeasonId,
        },
      });
    }
  });

  revalidatePath("/admin/players");
  revalidatePath("/admin/teams");
  return { success: true };
}

export async function updatePlayer(id: string, formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = playerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const body = toPlayerWriteBody(parsed.data);
  if (!body.ok) {
    return { error: body.error };
  }

  await prisma.player.update({
    where: { id, leagueId: league.id },
    data: body.data,
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
  const league = await requireLeagueContext();
  const [team, season] = await Promise.all([
    prisma.team.findFirst({
      where: { id: data.teamId, leagueId: league.id },
    }),
    prisma.season.findFirst({
      where: { id: data.seasonId, leagueId: league.id },
    }),
  ]);
  if (!team || !season) {
    return { error: "Команда или сезон не найдены в этой лиге." };
  }

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
  revalidatePath("/admin/teams");
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
  revalidatePath("/admin/teams");
  return { success: true };
}
