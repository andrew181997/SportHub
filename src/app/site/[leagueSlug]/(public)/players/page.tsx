import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ListPagination } from "@/components/public/list-pagination";
import { TournamentFilterSuspense } from "@/components/public/tournament-filter-suspense";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";
import {
  buildPortalListQuery,
  parseListSearchQuery,
  parseTournamentFilterId,
} from "@/lib/public-filters";
import { PortalListSearchSuspense } from "@/components/public/portal-list-search-suspense";
import { getPlayerRoleLabel } from "@/lib/sport-config";

export default async function PlayersPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueSlug: string }>;
  searchParams: Promise<{ page?: string; tournament?: string; q?: string }>;
}) {
  const { leagueSlug } = await params;
  const { page: pageRaw, tournament: tournamentRaw, q: qRaw } = await searchParams;
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

  const searchQ = parseListSearchQuery(qRaw);

  const page = parseListPage(pageRaw);

  const tournamentForFilter = activeTournamentFilter
    ? await prisma.tournament.findFirst({
        where: {
          id: activeTournamentFilter,
          leagueId: league.id,
          archivedAt: null,
        },
        select: { id: true, seasonId: true },
      })
    : null;

  const playerWhere: Prisma.PlayerWhereInput = {
    leagueId: league.id,
    archivedAt: null,
    ...(tournamentForFilter
      ? {
          rosters: {
            some: {
              seasonId: tournamentForFilter.seasonId,
              team: {
                standings: {
                  some: { tournamentId: tournamentForFilter.id },
                },
              },
            },
          },
        }
      : {}),
    ...(searchQ
      ? {
          OR: [
            { lastName: { contains: searchQ, mode: "insensitive" } },
            { firstName: { contains: searchQ, mode: "insensitive" } },
            { middleName: { contains: searchQ, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const total = await prisma.player.count({
    where: playerWhere,
  });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const players = await prisma.player.findMany({
    where: playerWhere,
    orderBy: { lastName: "asc" },
    skip: meta.skip,
    take: meta.pageSize,
    include: {
      rosters: {
        take: 1,
        orderBy: { season: { startDate: "desc" } },
        include: { team: { select: { name: true } } },
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Игроки</h1>
          <TournamentFilterSuspense tournaments={tournamentOptions} className="sm:justify-end" />
        </div>
        <PortalListSearchSuspense placeholder="Поиск по фамилии, имени или отчеству…" />
      </div>

      <div className="mt-6 surface-table-wrap">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Игрок</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Амплуа</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Команда</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {players.map((p) => (
              <tr key={p.id} className="surface-player-row">
                <td className="px-4 py-3">
                  <Link href={`/players/${p.id}`} className="font-medium text-blue-700 hover:underline">
                    {p.lastName} {p.firstName} {p.middleName ?? ""}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {getPlayerRoleLabel(league.sportType, p.role)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {p.rosters[0]?.team.name ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ListPagination
        meta={meta}
        query={buildPortalListQuery({
          tournament: activeTournamentFilter,
          q: searchQ,
        })}
      />

      {players.length === 0 && (
        <p className="mt-8 text-slate-500">
          {searchQ ? "Ничего не найдено по запросу." : "Нет игроков"}
        </p>
      )}
    </div>
  );
}
