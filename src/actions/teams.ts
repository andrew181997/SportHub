"use server";

import { prisma } from "@/lib/prisma";
import { teamSchema } from "@/lib/validations/league";
import { requireLeagueContext } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

export async function createTeam(formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = teamSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  await prisma.team.create({
    data: { ...parsed.data, leagueId: league.id },
  });

  revalidatePath("/admin/teams");
  return { success: true };
}

export async function updateTeam(id: string, formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = teamSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  await prisma.team.update({
    where: { id, leagueId: league.id },
    data: parsed.data,
  });

  revalidatePath("/admin/teams");
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
