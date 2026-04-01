import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TeamCreateForm } from "@/components/admin/team-create-form";
import { AdminSearchForm } from "@/components/admin/admin-search-form";
import type { Prisma } from "@prisma/client";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueSlug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  noStore();
  const { leagueSlug } = await params;
  const { q: qRaw, page: pageRaw } = await searchParams;
  const q = qRaw?.trim();
  const page = parseListPage(pageRaw);

  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const where: Prisma.TeamWhereInput = {
    leagueId: league.id,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const total = await prisma.team.count({ where });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const [teams, tournamentsForForm] = await Promise.all([
    prisma.team.findMany({
      where,
      orderBy: { name: "asc" },
      skip: meta.skip,
      take: meta.pageSize,
      include: { _count: { select: { rosters: true } } },
    }),
    prisma.tournament.findMany({
      where: { leagueId: league.id, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const pageQuery: Record<string, string | undefined> = q ? { q } : {};

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Команды</h1>
        <TeamCreateForm tournaments={tournamentsForForm} />
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
        <AdminSearchForm
          placeholder="Название или город…"
          defaultQuery={q ?? ""}
          resetHref="/admin/teams"
        />
      </div>

      <div className="mt-4 rounded-xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Название</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Город</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Игроков</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Статус</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Состав</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-slate-50/90">
                <td className="px-4 py-3 font-medium text-slate-900">{team.name}</td>
                <td className="px-4 py-3 text-slate-600">{team.city ?? "—"}</td>
                <td className="px-4 py-3 text-right text-slate-600">{team._count.rosters}</td>
                <td className="px-4 py-3">
                  {team.archivedAt ? (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Архив</span>
                  ) : (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Активная</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/players?team=${encodeURIComponent(team.id)}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Игроки команды
                  </Link>
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  {q ? "Ничего не найдено." : "Нет команд"}
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
