import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";
import { getPlayerRoleLabel } from "@/lib/sport-config";

export default async function PlayersPage({
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
  const total = await prisma.player.count({
    where: { leagueId: league.id, archivedAt: null },
  });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const players = await prisma.player.findMany({
    where: { leagueId: league.id, archivedAt: null },
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
      <h1 className="text-2xl font-bold text-slate-900">Игроки</h1>

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

      <ListPagination meta={meta} />

      {players.length === 0 && (
        <p className="mt-8 text-slate-500">Нет игроков</p>
      )}
    </div>
  );
}
