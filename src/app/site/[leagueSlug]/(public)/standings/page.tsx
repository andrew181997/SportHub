import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function StandingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { leagueSlug } = await params;
  const { page: pageRaw } = await searchParams;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const page = parseListPage(pageRaw);
  const total = await prisma.tournament.count({
    where: { leagueId: league.id, archivedAt: null },
  });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const tournaments = await prisma.tournament.findMany({
    where: { leagueId: league.id, archivedAt: null },
    include: {
      season: { select: { name: true } },
      standings: {
        include: { team: { select: { name: true, logo: true } } },
        orderBy: [{ points: "desc" }, { goalsFor: "desc" }],
      },
    },
    orderBy: { name: "asc" },
    skip: meta.skip,
    take: meta.pageSize,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Турнирные таблицы</h1>

      {tournaments.map((tournament) => (
        <div key={tournament.id} className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            {tournament.name}
            <span className="text-sm font-normal text-slate-600 ml-2">
              {tournament.season.name}
            </span>
          </h2>

          <div className="mt-4 surface-table-wrap overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 w-8">#</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Команда</th>
                  <th className="text-center px-3 py-3 font-medium text-slate-600">И</th>
                  <th className="text-center px-3 py-3 font-medium text-slate-600">В</th>
                  <th className="text-center px-3 py-3 font-medium text-slate-600">Н</th>
                  <th className="text-center px-3 py-3 font-medium text-slate-600">П</th>
                  <th className="text-center px-3 py-3 font-medium text-slate-600">ЗШ</th>
                  <th className="text-center px-3 py-3 font-medium text-slate-600">ПШ</th>
                  <th className="text-center px-3 py-3 font-medium text-slate-600">Р</th>
                  <th className="text-center px-3 py-3 font-medium text-slate-800 font-bold">О</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tournament.standings.map((row, i) => (
                  <tr key={row.id} className="surface-player-row">
                    <td className="px-4 py-3 text-slate-600 font-medium">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.team.name}</td>
                    <td className="text-center px-3 py-3 text-slate-600">{row.gamesPlayed}</td>
                    <td className="text-center px-3 py-3 text-slate-600">{row.wins}</td>
                    <td className="text-center px-3 py-3 text-slate-600">{row.draws}</td>
                    <td className="text-center px-3 py-3 text-slate-600">{row.losses}</td>
                    <td className="text-center px-3 py-3 text-slate-600">{row.goalsFor}</td>
                    <td className="text-center px-3 py-3 text-slate-600">{row.goalsAgainst}</td>
                    <td className="text-center px-3 py-3 text-slate-600">
                      {row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}
                      {row.goalsFor - row.goalsAgainst}
                    </td>
                    <td className="text-center px-3 py-3 font-bold text-slate-900">{row.points}</td>
                  </tr>
                ))}
                {tournament.standings.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                      Нет данных
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <ListPagination meta={meta} className="mt-10" />

      {tournaments.length === 0 && (
        <p className="mt-8 text-slate-500">Нет активных турниров</p>
      )}
    </div>
  );
}
