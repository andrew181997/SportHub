"use server";

import { prisma } from "@/lib/prisma";
import { refereeSchema } from "@/lib/validations/league";
import { requireLeagueContext } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

function revalidateRefereePaths() {
  revalidatePath("/admin/referees");
  revalidatePath("/referees");
}

export async function createReferee(formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = refereeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  await prisma.referee.create({
    data: { ...parsed.data, leagueId: league.id },
  });

  revalidateRefereePaths();
  return { success: true };
}

export async function updateReferee(id: string, formData: FormData) {
  const league = await requireLeagueContext();
  const parsed = refereeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const updated = await prisma.referee.updateMany({
    where: { id, leagueId: league.id },
    data: parsed.data,
  });
  if (updated.count === 0) {
    return { error: "Судья не найден" };
  }

  revalidateRefereePaths();
  revalidatePath("/admin/matches");
  return { success: true };
}

export async function deleteReferee(id: string) {
  const league = await requireLeagueContext();

  const deleted = await prisma.referee.deleteMany({
    where: { id, leagueId: league.id },
  });
  if (deleted.count === 0) {
    return { error: "Судья не найден" };
  }

  revalidateRefereePaths();
  revalidatePath("/admin/matches");
  return { success: true };
}
