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

  const [matches, tournaments, teams] = await Promise.all([
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
      select: { id: true, name: true },
    }),
    prisma.team.findMany({
      where: { leagueId: league.id, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

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
        <MatchCreateForm tournaments={tournaments} teams={teams} />
      </div>

      <div className="mt-6 rounded-xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Дата</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Матч</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Счёт</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Турнир</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Статус</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {matches.map((m) => (
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
                <td className="px-4 py-3 text-slate-600 text-xs">{m.tournament.name}</td>
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
            ))}
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
