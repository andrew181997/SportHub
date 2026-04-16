"use server";

import { prisma } from "@/lib/prisma";
import { coachSchema } from "@/lib/validations/league";
import { requireLeagueContext } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

function revalidateCoachPaths() {
  revalidatePath("/admin/coaches");
  revalidatePath("/coaches");
}

export async function createCoach(formData: FormData) {
  const league = await requireLeagueContext();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = coachSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  let teamId: string | null = parsed.data.teamId ?? null;
  if (teamId) {
    const team = await prisma.team.findFirst({
      where: { id: teamId, leagueId: league.id, archivedAt: null },
    });
    if (!team) {
      return { error: "Команда не найдена или в архиве." };
    }
  } else {
    teamId = null;
  }

  await prisma.coach.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      photo: parsed.data.photo,
      teamId,
      leagueId: league.id,
    },
  });

  revalidateCoachPaths();
  return { success: true };
}

export async function updateCoach(id: string, formData: FormData) {
  const league = await requireLeagueContext();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = coachSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  let teamId: string | null = parsed.data.teamId ?? null;
  if (teamId) {
    const team = await prisma.team.findFirst({
      where: { id: teamId, leagueId: league.id, archivedAt: null },
    });
    if (!team) {
      return { error: "Команда не найдена или в архиве." };
    }
  } else {
    teamId = null;
  }

  const updated = await prisma.coach.updateMany({
    where: { id, leagueId: league.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      photo: parsed.data.photo,
      teamId,
    },
  });
  if (updated.count === 0) {
    return { error: "Тренер не найден" };
  }

  revalidateCoachPaths();
  return { success: true };
}

export async function deleteCoach(id: string) {
  const league = await requireLeagueContext();

  const deleted = await prisma.coach.deleteMany({
    where: { id, leagueId: league.id },
  });
  if (deleted.count === 0) {
    return { error: "Тренер не найден" };
  }

  revalidateCoachPaths();
  return { success: true };
}
