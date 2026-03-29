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
  });

  if (!league) notFound();

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
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold">{league.name}</h1>
          {league.description && (
            <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
              {league.description}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {/* Ближайшие матчи */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Ближайшие матчи
                </h2>
                <Link href="/calendar" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  Все матчи <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingMatches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="rounded-lg border bg-white p-4 flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="font-medium text-gray-900 text-sm flex-1 text-right truncate">
                        {match.homeTeam.name}
                      </span>
                      <span className="text-xs text-gray-400 font-medium px-3 py-1 bg-gray-100 rounded shrink-0">
                        VS
                      </span>
                      <span className="font-medium text-gray-900 text-sm flex-1 truncate">
                        {match.awayTeam.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 ml-4 whitespace-nowrap shrink-0">
                      {formatDateLong(match.datetime)}
                    </span>
                  </Link>
                ))}
                {upcomingMatches.length === 0 && (
                  <p className="text-sm text-gray-400 py-4">Нет запланированных матчей</p>
                )}
              </div>
            </section>

            {/* Последние результаты */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-blue-600" />
                  Последние результаты
                </h2>
                <Link href="/results" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  Все результаты <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentResults.map((match) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="rounded-lg border bg-white p-4 flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="font-medium text-gray-900 text-sm flex-1 text-right truncate">
                        {match.homeTeam.name}
                      </span>
                      <span className="text-lg font-bold text-gray-900 px-3 shrink-0 tabular-nums">
                        {match.homeScore} : {match.awayScore}
                      </span>
                      <span className="font-medium text-gray-900 text-sm flex-1 truncate">
                        {match.awayTeam.name}
                      </span>
                    </div>
                  </Link>
                ))}
                {recentResults.length === 0 && (
                  <p className="text-sm text-gray-400 py-4">Нет завершённых матчей</p>
                )}
              </div>
            </section>
          </div>

          {/* Новости */}
          <aside>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Новости</h2>
            <div className="space-y-4">
              {latestNews.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="block rounded-lg border bg-white p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {article.title}
                  </h3>
                  {article.publishedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDateLong(article.publishedAt)}
                    </p>
                  )}
                </Link>
              ))}
              {latestNews.length === 0 && (
                <p className="text-sm text-gray-400">Нет новостей</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
