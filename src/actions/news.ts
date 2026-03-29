"use server";

import { prisma } from "@/lib/prisma";
import { newsSchema } from "@/lib/validations/league";
import { requireLeagueContext } from "@/lib/tenant";
import { sanitizeHtml } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";

export async function createNews(formData: FormData) {
  const league = await requireLeagueContext();
  const raw = Object.fromEntries(formData);

  const tags = typeof raw.tags === "string" ? raw.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const parsed = newsSchema.safeParse({ ...raw, tags });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const existingSlug = await prisma.news.findUnique({
    where: { leagueId_slug: { leagueId: league.id, slug: parsed.data.slug } },
  });

  if (existingSlug) {
    return { error: "Новость с таким slug уже существует" };
  }

  await prisma.news.create({
    data: {
      ...parsed.data,
      content: sanitizeHtml(parsed.data.content),
      coverImage: raw.coverImage as string | undefined,
      leagueId: league.id,
    },
  });

  revalidatePath("/admin/news");
  revalidatePath("/news");
  return { success: true };
}

export async function updateNews(id: string, formData: FormData) {
  const league = await requireLeagueContext();
  const raw = Object.fromEntries(formData);

  const tags = typeof raw.tags === "string" ? raw.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const parsed = newsSchema.safeParse({ ...raw, tags });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  await prisma.news.update({
    where: { id, leagueId: league.id },
    data: {
      ...parsed.data,
      content: sanitizeHtml(parsed.data.content),
      coverImage: raw.coverImage as string | undefined,
    },
  });

  revalidatePath("/admin/news");
  revalidatePath("/news");
  return { success: true };
}

export async function deleteNews(id: string) {
  const league = await requireLeagueContext();

  await prisma.news.delete({
    where: { id, leagueId: league.id },
  });

  revalidatePath("/admin/news");
  revalidatePath("/news");
  return { success: true };
}

export async function publishNews(id: string) {
  const league = await requireLeagueContext();

  await prisma.news.update({
    where: { id, leagueId: league.id },
    data: { publishedAt: new Date() },
  });

  revalidatePath("/admin/news");
  revalidatePath("/news");
  return { success: true };
}
