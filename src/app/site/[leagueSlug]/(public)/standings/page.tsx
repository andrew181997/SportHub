import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const tournaments = await prisma.tournament.findMany({
    where: { leagueId: league.id, archivedAt: null },
    include: {
      season: { select: { name: true } },
      standings: {
        include: { team: { select: { name: true, logo: true } } },
        orderBy: [{ points: "desc" }, { goalsFor: "desc" }],
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Турнирные таблицы</h1>

      {tournaments.map((tournament) => (
        <div key={tournament.id} className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            {tournament.name}
            <span className="text-sm font-normal text-gray-500 ml-2">
              {tournament.season.name}
            </span>
          </h2>

          <div className="mt-4 rounded-xl border bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-8">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Команда</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">И</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">В</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">Н</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">П</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">ЗШ</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">ПШ</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">Р</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500 font-bold">О</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tournament.standings.map((row, i) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-medium">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.team.name}</td>
                    <td className="text-center px-3 py-3 text-gray-500">{row.gamesPlayed}</td>
                    <td className="text-center px-3 py-3 text-gray-500">{row.wins}</td>
                    <td className="text-center px-3 py-3 text-gray-500">{row.draws}</td>
                    <td className="text-center px-3 py-3 text-gray-500">{row.losses}</td>
                    <td className="text-center px-3 py-3 text-gray-500">{row.goalsFor}</td>
                    <td className="text-center px-3 py-3 text-gray-500">{row.goalsAgainst}</td>
                    <td className="text-center px-3 py-3 text-gray-500">
                      {row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}
                      {row.goalsFor - row.goalsAgainst}
                    </td>
                    <td className="text-center px-3 py-3 font-bold text-gray-900">{row.points}</td>
                  </tr>
                ))}
                {tournament.standings.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                      Нет данных
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {tournaments.length === 0 && (
        <p className="mt-8 text-gray-400">Нет активных турниров</p>
      )}
    </div>
  );
}
