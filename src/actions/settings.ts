"use server";

import { prisma } from "@/lib/prisma";
import { siteConfigSchema } from "@/lib/validations/league";
import { requireLeagueContext } from "@/lib/tenant";
import { uploadLeagueLogo } from "@/lib/upload";
import { revalidatePath } from "next/cache";

export async function updateSiteConfig(data: unknown) {
  const league = await requireLeagueContext();
  const parsed = siteConfigSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  await prisma.siteConfig.upsert({
    where: { leagueId: league.id },
    create: { leagueId: league.id, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateLeagueInfo(formData: FormData) {
  const league = await requireLeagueContext();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  await prisma.league.update({
    where: { id: league.id },
    data: { name, description },
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function uploadLogo(formData: FormData) {
  const league = await requireLeagueContext();
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return { error: "Выберите файл" };
  }

  try {
    const url = await uploadLeagueLogo(file, league.id);
    await prisma.league.update({
      where: { id: league.id },
      data: { logo: url },
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true, url };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ошибка загрузки" };
  }
}

export async function processApplication(
  applicationId: string,
  status: "APPROVED" | "REJECTED"
) {
  const league = await requireLeagueContext();

  await prisma.application.update({
    where: { id: applicationId, leagueId: league.id },
    data: { status },
  });

  revalidatePath("/admin/applications");
  return { success: true };
}
