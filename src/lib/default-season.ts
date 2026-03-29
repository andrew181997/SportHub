import { prisma } from "@/lib/prisma";

/** Имя учётного периода по умолчанию; в интерфейсе лиги сезон не создаётся вручную. */
export const DEFAULT_SEASON_NAME = "Сезон лиги";

/**
 * Возвращает существующий сезон лиги или создаёт один скрытый от пользователя
 * (для связей Tournament и TeamRoster).
 */
export async function ensureDefaultSeason(leagueId: string) {
  const existing = await prisma.season.findFirst({
    where: { leagueId },
    orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
  });
  if (existing) return existing;

  const league = await prisma.league.findUniqueOrThrow({
    where: { id: leagueId },
    select: { createdAt: true },
  });
  const y = league.createdAt.getFullYear();
  const startDate = new Date(y, 0, 1);
  const endDate = new Date(y + 5, 11, 31);

  return prisma.season.create({
    data: {
      name: DEFAULT_SEASON_NAME,
      startDate,
      endDate,
      isCurrent: true,
      leagueId,
    },
  });
}
