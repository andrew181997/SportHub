import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ListPagination } from "@/components/public/list-pagination";
import { TournamentFilterSuspense } from "@/components/public/tournament-filter-suspense";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";
import { parseTournamentFilterId } from "@/lib/public-filters";
import { PlayoffBracket } from "@/components/public/playoff-bracket";
import {
  mapSeriesToBracketItem,
  type PlayoffSeriesForBracket,
} from "@/lib/playoff-bracket-display";
import { loadPlayoffSeriesRowsForTournaments } from "@/lib/playoff-bracket-queries";

const tournamentStandingQuery = {
  include: {
    season: { select: { name: true } },
    standings: {
      include: { team: { select: { name: true, logo: true } } },
      orderBy: [{ points: "desc" as const }, { goalsFor: "desc" as const }],
    },
  },
} satisfies { include: Prisma.TournamentInclude };

type TournamentStandingBlock = Prisma.TournamentGetPayload<
  typeof tournamentStandingQuery
>;

export default async function StandingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueSlug: string }>;
  searchParams: Promise<{ page?: string; tournament?: string }>;
}) {
  const { leagueSlug } = await params;
  const { page: pageRaw, tournament: tournamentRaw } = await searchParams;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const tournamentOptions = await prisma.tournament.findMany({
    where: { leagueId: league.id, archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const filterId = parseTournamentFilterId(tournamentRaw);
  const activeTournamentFilter =
    filterId && tournamentOptions.some((t) => t.id === filterId) ? filterId : undefined;

  const page = parseListPage(pageRaw);

  const singleTournament = activeTournamentFilter
    ? await prisma.tournament.findFirst({
        where: {
          id: activeTournamentFilter,
          leagueId: league.id,
          archivedAt: null,
        },
        ...tournamentStandingQuery,
      })
    : null;

  let meta: ReturnType<typeof computeListPagination>;
  let tournaments: TournamentStandingBlock[];

  if (singleTournament) {
    tournaments = [singleTournament];
    meta = {
      page: 1,
      pageSize: DEFAULT_LIST_PAGE_SIZE,
      total: 1,
      totalPages: 1,
      skip: 0,
    };
  } else {
    const total = await prisma.tournament.count({
      where: { leagueId: league.id, archivedAt: null },
    });
    meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);
    tournaments = await prisma.tournament.findMany({
      where: { leagueId: league.id, archivedAt: null },
      ...tournamentStandingQuery,
      orderBy: { name: "asc" },
      skip: meta.skip,
      take: meta.pageSize,
    });
  }

  const playoffTournamentIds = tournaments
    .filter((t) => t.type === "PLAYOFF")
    .map((t) => t.id);

  const playoffSeriesRows =
    await loadPlayoffSeriesRowsForTournaments(playoffTournamentIds);

  const playoffBracketByTournament = new Map<string, PlayoffSeriesForBracket[]>();
  for (const row of playoffSeriesRows) {
    const item = mapSeriesToBracketItem(row);
    const list = playoffBracketByTournament.get(row.tournamentId) ?? [];
    list.push(item);
    playoffBracketByTournament.set(row.tournamentId, list);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Турнирные таблицы</h1>
        <TournamentFilterSuspense tournaments={tournamentOptions} className="sm:justify-end" />
      </div>

      {tournaments.map((tournament) => {
        const bracket = playoffBracketByTournament.get(tournament.id) ?? [];
        return (
        <div key={tournament.id} className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            {tournament.name}
            <span className="text-sm font-normal text-slate-600 ml-2">
              {tournament.season.name}
            </span>
          </h2>

          {tournament.type === "PLAYOFF" ? (
            bracket.length > 0 ? (
              <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/30 p-4">
                <PlayoffBracket series={bracket} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Сетка плей-офф появится после добавления серий между командами.
              </p>
            )
          ) : (
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
          )}
        </div>
        );
      })}

      <ListPagination
        meta={meta}
        className="mt-10"
        query={
          activeTournamentFilter
            ? { tournament: activeTournamentFilter }
            : undefined
        }
      />

      {tournaments.length === 0 && (
        <p className="mt-8 text-slate-500">Нет активных турниров</p>
      )}
    </div>
  );
}
