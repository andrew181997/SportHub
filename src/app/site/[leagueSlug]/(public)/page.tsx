import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LeagueHomeBlocks } from "@/components/public/league-home-blocks";
import { parseHomeSectionsFromDb } from "@/lib/home-sections";

export default async function LeagueHomePage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    include: { siteConfig: true },
  });

  if (!league) notFound();

  const primary = league.siteConfig?.primaryColor ?? "#1d4ed8";
  const secondary = league.siteConfig?.secondaryColor ?? "#9333ea";
  const siteTheme = league.siteConfig?.theme ?? "default";

  const heroBackground =
    siteTheme === "sport"
      ? `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
      : siteTheme === "dark"
        ? "linear-gradient(135deg, #0f172a 0%, #020617 100%)"
        : `linear-gradient(135deg, ${primary} 0%, #1e293b 92%)`;

  const sectionsConfig = parseHomeSectionsFromDb(league.siteConfig?.sections);
  const visibleOrder = sectionsConfig
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)
    .map((s) => s.type);

  const [
    upcomingMatches,
    recentResults,
    latestNews,
    standingsTournament,
    teamsPreview,
  ] = await Promise.all([
    prisma.match.findMany({
      where: { leagueId: league.id, status: "SCHEDULED", archivedAt: null },
      orderBy: { datetime: "asc" },
      take: 5,
      include: {
        homeTeam: { select: { name: true, logo: true } },
        awayTeam: { select: { name: true, logo: true } },
        tournament: { select: { name: true } },
      },
    }),
    prisma.match.findMany({
      where: { leagueId: league.id, status: "FINISHED", archivedAt: null },
      orderBy: { datetime: "desc" },
      take: 5,
      include: {
        homeTeam: { select: { name: true, logo: true } },
        awayTeam: { select: { name: true, logo: true } },
      },
    }),
    prisma.news.findMany({
      where: { leagueId: league.id, hidden: false, publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
    prisma.tournament.findFirst({
      where: { leagueId: league.id, archivedAt: null },
      orderBy: { name: "asc" },
      include: {
        standings: {
          take: 8,
          orderBy: [{ points: "desc" }, { goalsFor: "desc" }],
          include: { team: { select: { name: true } } },
        },
      },
    }),
    prisma.team.findMany({
      where: { leagueId: league.id, archivedAt: null },
      orderBy: { name: "asc" },
      take: 6,
      select: { id: true, name: true, city: true, logo: true },
    }),
  ]);

  return (
    <LeagueHomeBlocks
      league={{ name: league.name, description: league.description }}
      primary={primary}
      heroBackground={heroBackground}
      sectionOrder={visibleOrder}
      data={{
        upcomingMatches,
        recentResults,
        latestNews,
        standingsTournamentName: standingsTournament?.name ?? null,
        standingsRows: standingsTournament?.standings ?? [],
        teamsPreview,
      }}
    />
  );
}
