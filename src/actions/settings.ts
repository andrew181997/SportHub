"use server";

import { prisma } from "@/lib/prisma";
import { siteAppearanceSchema } from "@/lib/validations/league";
import { requireLeagueContext } from "@/lib/tenant";
import { uploadLeagueLogo } from "@/lib/upload";
import { revalidatePath } from "next/cache";

function revalidateLeagueSite(slug: string) {
  /** Публичный сайт и админка живут под `/site/[slug]/…` (rewrite с поддомена). */
  revalidatePath(`/site/${slug}`, "layout");
  revalidatePath(`/site/${slug}/admin`, "layout");
}

export async function updateSiteConfig(data: unknown) {
  const league = await requireLeagueContext();
  const parsed = siteAppearanceSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const { footerText, ...colorsAndTheme } = parsed.data;

  await prisma.siteConfig.upsert({
    where: { leagueId: league.id },
    create: {
      leagueId: league.id,
      ...colorsAndTheme,
      footerText: footerText?.trim() ? footerText.trim() : null,
    },
    update: {
      ...colorsAndTheme,
      footerText: footerText?.trim() ? footerText.trim() : null,
    },
  });

  revalidateLeagueSite(league.slug);
  return { success: true };
}

export async function updateLeagueInfo(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const league = await requireLeagueContext();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return { error: "Укажите название лиги" };
  }

  try {
    await prisma.league.update({
      where: { id: league.id },
      data: { name, description },
    });

    revalidateLeagueSite(league.slug);
    return { success: true };
  } catch {
    return { error: "Не удалось сохранить данные" };
  }
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

    revalidateLeagueSite(league.slug);
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
