import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function AdminApplicationsPage({
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
  const total = await prisma.application.count({ where });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const applications = await prisma.application.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: meta.skip,
    take: meta.pageSize,
    include: { tournament: { select: { name: true } } },
  });

  const statusLabels: Record<string, string> = {
    PENDING: "Ожидает",
    APPROVED: "Одобрена",
    REJECTED: "Отклонена",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Заявки</h1>

      <div className="mt-6 rounded-xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Команда</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Контакт</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Турнир</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {applications.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/90">
                <td className="px-4 py-3 font-medium text-slate-900">{a.teamName}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {a.contactName} &middot; {a.contactEmail}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{a.tournament.name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[a.status]}`}>
                    {statusLabels[a.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{formatDateTime(a.createdAt)}</td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Нет заявок
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
