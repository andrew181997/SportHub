import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function AdminNewsPage({
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
  const total = await prisma.news.count({ where });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const articles = await prisma.news.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: meta.skip,
    take: meta.pageSize,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Новости</h1>
      </div>

      <div className="mt-6 rounded-xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Заголовок</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Создана</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/90">
                <td className="px-4 py-3 font-medium text-slate-900">{a.title}</td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{a.slug}</td>
                <td className="px-4 py-3">
                  {a.hidden ? (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Скрыта</span>
                  ) : a.publishedAt ? (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Опубликована</span>
                  ) : (
                    <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Черновик</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{formatDateTime(a.createdAt)}</td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Нет новостей
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
