import { prisma } from "./prisma";

function buildTsQuery(query: string): string {
  return query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word}:*`)
    .join(" & ");
}

export async function searchPlayers(leagueId: string, query: string) {
  if (!query.trim()) return [];
  const tsQuery = buildTsQuery(query);

  return prisma.$queryRaw`
    SELECT id, "firstName", "lastName", "middleName", photo, role
    FROM "Player"
    WHERE "leagueId" = ${leagueId}
      AND "archivedAt" IS NULL
      AND "searchVector" @@ to_tsquery('russian', ${tsQuery})
    ORDER BY ts_rank("searchVector", to_tsquery('russian', ${tsQuery})) DESC
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
  const tsQuery = buildTsQuery(query);

  return prisma.$queryRaw`
    SELECT id, title, slug, "coverImage", "publishedAt"
    FROM "News"
    WHERE "leagueId" = ${leagueId}
      AND hidden = false
      AND "publishedAt" IS NOT NULL
      AND "searchVector" @@ to_tsquery('russian', ${tsQuery})
    ORDER BY ts_rank("searchVector", to_tsquery('russian', ${tsQuery})) DESC
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
