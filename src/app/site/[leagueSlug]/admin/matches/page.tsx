import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { MatchCreateForm } from "@/components/admin/match-create-form";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function AdminMatchesPage({
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
  const where = { leagueId: league.id };
  const total = await prisma.match.count({ where });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const [matches, tournaments, standingsRows, playoffSeriesOptions] = await Promise.all([
    prisma.match.findMany({
      where,
      orderBy: { datetime: "desc" },
      skip: meta.skip,
      take: meta.pageSize,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        tournament: { select: { name: true } },
      },
    }),
    prisma.tournament.findMany({
      where: { leagueId: league.id, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true },
    }),
    prisma.standing.findMany({
      where: { tournament: { leagueId: league.id } },
      select: {
        tournamentId: true,
        team: { select: { id: true, name: true } },
      },
    }),
    prisma.playoffSeries.findMany({
      where: { tournament: { leagueId: league.id } },
      include: {
        teamA: { select: { name: true } },
        teamB: { select: { name: true } },
      },
    }),
  ]);

  const playoffSeriesForForm = playoffSeriesOptions.map((s) => ({
    id: s.id,
    tournamentId: s.tournamentId,
    label: `${s.label ? `${s.label} · ` : ""}${s.teamA.name} — ${s.teamB.name}`,
  }));

  const participantsByTournament = new Map<
    string,
    { id: string; name: string }[]
  >();
  for (const row of standingsRows) {
    const list = participantsByTournament.get(row.tournamentId) ?? [];
    list.push({ id: row.team.id, name: row.team.name });
    participantsByTournament.set(row.tournamentId, list);
  }
  for (const [, list] of participantsByTournament) {
    list.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }

  const tournamentParticipantLists = tournaments.map((t) => ({
    tournamentId: t.id,
    teams: participantsByTournament.get(t.id) ?? [],
  }));

  const seriesIdList = [
    ...new Set(
      matches
        .map((m) => m.playoffSeriesId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];
  const seriesRows =
    seriesIdList.length > 0
      ? await prisma.playoffSeries.findMany({
          where: { id: { in: seriesIdList } },
          select: {
            id: true,
            winnerTeamId: true,
            teamA: { select: { id: true, name: true } },
            teamB: { select: { id: true, name: true } },
          },
        })
      : [];
  const seriesById = new Map(seriesRows.map((s) => [s.id, s]));

  const statusLabels: Record<string, string> = {
    SCHEDULED: "Запланирован",
    LIVE: "Идёт",
    FINISHED: "Завершён",
    POSTPONED: "Перенесён",
    CANCELLED: "Отменён",
  };

  const statusColors: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-700",
    LIVE: "bg-red-100 text-red-700",
    FINISHED: "bg-green-100 text-green-700",
    POSTPONED: "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Матчи</h1>
        <MatchCreateForm
          tournaments={tournaments}
          participantsByTournament={tournamentParticipantLists}
          playoffSeries={playoffSeriesForForm}
        />
      </div>

      <div className="mt-6 rounded-xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Дата</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Матч</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Счёт</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Турнир / серия</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Статус</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {matches.map((m) => {
              const ps = m.playoffSeriesId
                ? seriesById.get(m.playoffSeriesId)
                : undefined;
              return (
              <tr key={m.id} className="hover:bg-slate-50/90">
                <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                  {formatDateTime(m.datetime)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {m.homeTeam.name} — {m.awayTeam.name}
                </td>
                <td className="px-4 py-3 text-center font-bold text-slate-900">
                  {m.status === "FINISHED"
                    ? `${m.homeScore}:${m.awayScore}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  <div>{m.tournament.name}</div>
                  {ps ? (
                    <div className="mt-0.5 text-[11px] text-violet-700">
                      Серия: {ps.teamA.name} — {ps.teamB.name}
                      {ps.winnerTeamId
                        ? ` · победитель: ${
                            ps.winnerTeamId === ps.teamA.id
                              ? ps.teamA.name
                              : ps.teamB.name
                          }`
                        : ""}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[m.status]}`}>
                    {statusLabels[m.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/matches/${m.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {m.status === "FINISHED" ? "Результат и протокол" : "Протокол / результат"}
                  </Link>
                </td>
              </tr>
            );
            })}
            {matches.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Нет матчей
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ListPagination meta={meta} className="mt-6" />
    </div>
  );
}
