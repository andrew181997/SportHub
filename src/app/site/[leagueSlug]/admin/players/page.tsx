import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PlayerCreateForm } from "@/components/admin/player-create-form";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import { getSportConfig } from "@/lib/sport-config";
import type { Prisma } from "@prisma/client";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueSlug: string }>;
  searchParams: Promise<{ q?: string; team?: string; page?: string }>;
}) {
  noStore();
  const { leagueSlug } = await params;
  const { q: qRaw, team: teamRaw, page: pageRaw } = await searchParams;
  const q = qRaw?.trim();
  const teamFilter = teamRaw?.trim();
  const page = parseListPage(pageRaw);

  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const sportConfig = getSportConfig(league.sportType);
  const roleLabel = (role: string) =>
    sportConfig.positions.find((p) => p.value === role)?.label ?? role;

  const [teams, filterTeam] = await Promise.all([
    prisma.team.findMany({
      where: { leagueId: league.id, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    teamFilter
      ? prisma.team.findFirst({
          where: { id: teamFilter, leagueId: league.id },
          select: { id: true, name: true },
        })
      : null,
  ]);

  const where: Prisma.PlayerWhereInput = { leagueId: league.id };
  if (teamFilter && filterTeam) {
    where.rosters = { some: { teamId: teamFilter } };
  }
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { middleName: { contains: q, mode: "insensitive" } },
    ];
  }

  const total = await prisma.player.count({ where });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const players = await prisma.player.findMany({
    where,
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

  const resetHref = teamFilter ? `?team=${encodeURIComponent(teamFilter)}` : "/admin/players";
  const hiddenFields = teamFilter ? [{ name: "team", value: teamFilter }] : [];

  const pageQuery: Record<string, string | undefined> = {};
  if (q) pageQuery.q = q;
  if (teamFilter && filterTeam) pageQuery.team = teamFilter;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Игроки</h1>
          {teamFilter && filterTeam ? (
            <p className="mt-1 text-sm text-gray-600">
              Фильтр: команда «{filterTeam.name}» ·{" "}
              <Link href="/admin/players" className="text-blue-600 hover:text-blue-800">
                все игроки
              </Link>
            </p>
          ) : null}
          {teamFilter && !filterTeam ? (
            <p className="mt-1 text-sm text-amber-700">
              Команда с таким идентификатором не найдена — показан полный список игроков.
            </p>
          ) : null}
        </div>
        <PlayerCreateForm
          positions={sportConfig.positions}
          teams={teams}
          defaultTeamId={filterTeam?.id ?? null}
        />
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
        <AdminSearchForm
          placeholder="Фамилия, имя или отчество…"
          defaultQuery={q ?? ""}
          hiddenFields={hiddenFields}
          resetHref={resetHref}
        />
      </div>

      <div className="mt-4 rounded-xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Фамилия Имя</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Амплуа</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Команда</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {players.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/90">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {p.lastName} {p.firstName}
                </td>
                <td className="px-4 py-3 text-slate-600">{roleLabel(p.role)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {p.rosters[0]?.team.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {p.archivedAt ? (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Архив</span>
                  ) : (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Активный</span>
                  )}
                </td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  {q || teamFilter ? "Ничего не найдено по заданным условиям." : "Нет игроков"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ListPagination meta={meta} query={pageQuery} className="mt-6" />
    </div>
  );
}
