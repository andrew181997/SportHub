import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/utils";

export default async function AdminNewsPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const articles = await prisma.news.findMany({
    where: { leagueId: league.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Новости</h1>
      </div>

      <div className="mt-6 rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Заголовок</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Создана</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.slug}</td>
                <td className="px-4 py-3">
                  {a.hidden ? (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Скрыта</span>
                  ) : a.publishedAt ? (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Опубликована</span>
                  ) : (
                    <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Черновик</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(a.createdAt)}</td>
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
    </div>
  );
}
