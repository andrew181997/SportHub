import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDateLong } from "@/lib/utils";
import { Calendar, Trophy, ArrowRight } from "lucide-react";

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

  const [upcomingMatches, recentResults, latestNews] = await Promise.all([
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
  ]);

  return (
    <div>
      <section
        className="league-hero text-white py-16 sm:py-28"
        style={{ background: heroBackground }}
      >
        <div className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-sm">
            {league.name}
          </h1>
          {league.description && (
            <p className="mt-5 text-base sm:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
              {league.description}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {/* Ближайшие матчи */}
            <section>
              <div className="flex items-center justify-between mb-5 gap-3">
                <h2 className="league-section-title">
                  <Calendar className="w-5 h-5 shrink-0" style={{ color: primary }} />
                  Ближайшие матчи
                </h2>
                <Link
                  href="/calendar"
                  className="league-link-arrow"
                  style={{ color: primary }}
                >
                  Все матчи <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingMatches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="surface-match p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <span className="font-semibold league-text-foreground text-sm flex-1 text-right truncate">
                        {match.homeTeam.name}
                      </span>
                      <span className="league-vs-pill shrink-0">VS</span>
                      <span className="font-semibold league-text-foreground text-sm flex-1 truncate">
                        {match.awayTeam.name}
                      </span>
                    </div>
                    <span className="text-xs league-text-muted sm:ml-4 whitespace-nowrap shrink-0 sm:text-right">
                      {formatDateLong(match.datetime)}
                    </span>
                  </Link>
                ))}
                {upcomingMatches.length === 0 && (
                  <p className="text-sm league-text-muted py-6 text-center league-empty-panel">
                    Нет запланированных матчей
                  </p>
                )}
              </div>
            </section>

            {/* Последние результаты */}
            <section>
              <div className="flex items-center justify-between mb-5 gap-3">
                <h2 className="league-section-title">
                  <Trophy className="w-5 h-5 shrink-0" style={{ color: primary }} />
                  Последние результаты
                </h2>
                <Link
                  href="/results"
                  className="league-link-arrow"
                  style={{ color: primary }}
                >
                  Все результаты <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentResults.map((match) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="surface-match p-4 sm:p-5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <span className="font-semibold league-text-foreground text-sm flex-1 text-right truncate">
                        {match.homeTeam.name}
                      </span>
                      <span className="text-lg font-bold league-text-foreground px-2 sm:px-3 shrink-0 tabular-nums min-w-[4.5rem] text-center">
                        {match.homeScore} : {match.awayScore}
                      </span>
                      <span className="font-semibold league-text-foreground text-sm flex-1 truncate">
                        {match.awayTeam.name}
                      </span>
                    </div>
                  </Link>
                ))}
                {recentResults.length === 0 && (
                  <p className="text-sm league-text-muted py-6 text-center league-empty-panel">
                    Нет завершённых матчей
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Новости */}
          <aside className="lg:pt-1">
            <h2 className="league-section-title mb-5">Новости</h2>
            <div className="space-y-4">
              {latestNews.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="block surface-entity-card p-4 sm:p-5 group"
                >
                  <h3 className="font-semibold league-text-foreground text-sm line-clamp-2 group-hover:text-[color:var(--league-primary)] transition-colors">
                    {article.title}
                  </h3>
                  {article.publishedAt && (
                    <p className="text-xs league-text-muted mt-2.5">
                      {formatDateLong(article.publishedAt)}
                    </p>
                  )}
                </Link>
              ))}
              {latestNews.length === 0 && (
                <p className="text-sm league-text-muted py-4 text-center league-empty-panel">
                  Нет новостей
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
