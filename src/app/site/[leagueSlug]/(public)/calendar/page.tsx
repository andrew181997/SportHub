import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDateLong } from "@/lib/utils";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const matches = await prisma.match.findMany({
    where: { leagueId: league.id, archivedAt: null, status: { in: ["SCHEDULED", "LIVE"] } },
    orderBy: { datetime: "asc" },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      tournament: { select: { name: true } },
    },
  });

  const statusLabels: Record<string, string> = {
    SCHEDULED: "Запланирован",
    LIVE: "Идёт",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Календарь матчей</h1>

      <div className="mt-6 space-y-3">
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/matches/${m.id}`}
            className="rounded-lg border bg-white p-4 flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900 flex-1 text-right truncate">
                {m.homeTeam.name}
              </span>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500 shrink-0">VS</span>
              <span className="text-sm font-medium text-gray-900 flex-1 truncate">
                {m.awayTeam.name}
              </span>
            </div>
            <div className="text-right ml-4 shrink-0">
              <p className="text-xs text-gray-500">{formatDateLong(m.datetime)}</p>
              <p className="text-xs text-gray-400">{m.tournament.name}</p>
              {m.status === "LIVE" && (
                <span className="inline-block mt-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 animate-pulse">
                  LIVE
                </span>
              )}
              <p className="text-xs text-blue-600 mt-1 font-medium">Карточка матча →</p>
            </div>
          </Link>
        ))}
        {matches.length === 0 && (
          <p className="text-gray-400 py-8 text-center">Нет запланированных матчей</p>
        )}
      </div>
    </div>
  );
}
