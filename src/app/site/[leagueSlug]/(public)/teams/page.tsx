import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
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

export default async function TeamsPage({
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

  const teamWhere: Prisma.TeamWhereInput = {
    leagueId: league.id,
    archivedAt: null,
    ...(activeTournamentFilter
      ? {
          standings: {
            some: { tournamentId: activeTournamentFilter },
          },
        }
      : {}),
    ...(searchQ
      ? {
          OR: [
            { name: { contains: searchQ, mode: "insensitive" } },
            { city: { contains: searchQ, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const total = await prisma.team.count({ where: teamWhere });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const teams = await prisma.team.findMany({
    where: teamWhere,
    orderBy: { name: "asc" },
    skip: meta.skip,
    take: meta.pageSize,
    include: { _count: { select: { rosters: true } } },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Команды</h1>
          <TournamentFilterSuspense tournaments={tournamentOptions} className="sm:justify-end" />
        </div>
        <PortalListSearchSuspense placeholder="Поиск по названию или городу…" />
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.id}`}
            className="surface-entity-card p-6 hover:shadow-lg hover:border-slate-400/90 transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500">
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  team.name.charAt(0)
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{team.name}</h3>
                {team.city && (
                  <p className="text-sm text-slate-600">{team.city}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">
              <Users className="w-3 h-3" />
              {team._count.rosters} игроков в составе
            </div>
          </Link>
        ))}
      </div>

      <ListPagination
        meta={meta}
        query={buildPortalListQuery({
          tournament: activeTournamentFilter,
          q: searchQ,
        })}
      />

      {teams.length === 0 && (
        <p className="mt-8 text-slate-500">
          {searchQ ? "Ничего не найдено по запросу." : "Нет команд"}
        </p>
      )}
    </div>
  );
}
