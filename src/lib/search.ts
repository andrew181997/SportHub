import { prisma } from "./prisma";

/** Безопасный полнотекстовый поиск: plainto_tsquery не ломается на спецсимволах. */
export async function searchPlayers(leagueId: string, query: string) {
  if (!query.trim()) return [];
  const q = query.trim();

  return prisma.$queryRaw<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      middleName: string | null;
      photo: string | null;
      role: string;
    }>
  >`
    SELECT id, "firstName", "lastName", "middleName", photo, role
    FROM "Player"
    WHERE "leagueId" = ${leagueId}
      AND "archivedAt" IS NULL
      AND "searchVector" @@ plainto_tsquery('russian', ${q})
    ORDER BY ts_rank_cd("searchVector", plainto_tsquery('russian', ${q})) DESC
    LIMIT 20
  `;
}

export async function searchTeams(leagueId: string, query: string) {
  if (!query.trim()) return [];

  return prisma.team.findMany({
    where: {
      leagueId,
      archivedAt: null,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, logo: true, city: true },
    take: 20,
  });
}

export async function searchNews(leagueId: string, query: string) {
  if (!query.trim()) return [];
  const q = query.trim();

  return prisma.$queryRaw<
    Array<{
      id: string;
      title: string;
      slug: string;
      coverImage: string | null;
      publishedAt: Date;
    }>
  >`
    SELECT id, title, slug, "coverImage", "publishedAt"
    FROM "News"
    WHERE "leagueId" = ${leagueId}
      AND hidden = false
      AND "publishedAt" IS NOT NULL
      AND "searchVector" @@ plainto_tsquery('russian', ${q})
    ORDER BY ts_rank_cd("searchVector", plainto_tsquery('russian', ${q})) DESC
    LIMIT 20
  `;
}

export async function globalSearch(leagueId: string, query: string) {
  const [players, teams, news] = await Promise.all([
    searchPlayers(leagueId, query),
    searchTeams(leagueId, query),
    searchNews(leagueId, query),
  ]);

  return { players, teams, news };
}
