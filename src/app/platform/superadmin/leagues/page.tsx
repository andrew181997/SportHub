import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function LeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageRaw } = await searchParams;
  const page = parseListPage(pageRaw);
  const total = await prisma.league.count();
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const leagues = await prisma.league.findMany({
    orderBy: { createdAt: "desc" },
    skip: meta.skip,
    take: meta.pageSize,
    include: {
      _count: { select: { teams: true, matches: true, players: true } },
      members: { include: { user: { select: { email: true, status: true } } }, where: { role: "ADMIN" } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Все лиги</h1>
      <p className="mt-1 text-sm text-gray-500">
        {total} лиг на платформе
      </p>

      <div className="mt-6 rounded-xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Название</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Спорт</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Владелец</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Команд</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Игроков</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Матчей</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Создана</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {leagues.map((league) => (
              <tr key={league.id} className="hover:bg-slate-50/90">
                <td className="px-4 py-3 font-medium text-slate-900">{league.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-blue-600">
                  <a href={`http://${league.slug}.sporthub.ru`} target="_blank" rel="noreferrer">
                    {league.slug}
                  </a>
                </td>
                <td className="px-4 py-3 text-slate-600">{league.sportType}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {league.members[0]?.user.email ?? "—"}
                  {league.members[0]?.user.status === "BLOCKED" && (
                    <span className="ml-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                      заблокирован
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">{league._count.teams}</td>
                <td className="px-4 py-3 text-right text-slate-600">{league._count.players}</td>
                <td className="px-4 py-3 text-right text-slate-600">{league._count.matches}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{formatDate(league.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ListPagination meta={meta} className="mt-6" />
    </div>
  );
}
