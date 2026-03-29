import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDateLong } from "@/lib/utils";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const matches = await prisma.match.findMany({
    where: { leagueId: league.id, status: "FINISHED", archivedAt: null },
    orderBy: { datetime: "desc" },
    take: 30,
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      tournament: { select: { name: true } },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Результаты</h1>

      <div className="mt-6 space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="rounded-lg border bg-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <span className="text-sm font-medium text-gray-900 flex-1 text-right">
                {m.homeTeam.name}
              </span>
              <span className="text-lg font-bold text-gray-900 px-3 min-w-[60px] text-center">
                {m.homeScore} : {m.awayScore}
              </span>
              <span className="text-sm font-medium text-gray-900 flex-1">
                {m.awayTeam.name}
              </span>
            </div>
            <div className="text-right ml-4">
              <p className="text-xs text-gray-500">{formatDateLong(m.datetime)}</p>
              <p className="text-xs text-gray-400">{m.tournament.name}</p>
              {(m.overtime || m.shootout) && (
                <span className="text-xs text-blue-600">
                  {m.shootout ? "Бул." : "ОТ"}
                </span>
              )}
            </div>
          </div>
        ))}
        {matches.length === 0 && (
          <p className="text-gray-400 py-8 text-center">Нет результатов</p>
        )}
      </div>
    </div>
  );
}
