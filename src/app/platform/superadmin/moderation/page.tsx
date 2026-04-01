import { prisma } from "@/lib/prisma";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; mp?: string }>;
}) {
  const sp = await searchParams;
  const newsPage = parseListPage(sp.page);
  const mediaPage = parseListPage(sp.mp);

  const [newsTotal, mediaTotal] = await Promise.all([
    prisma.news.count(),
    prisma.media.count(),
  ]);

  const newsMeta = computeListPagination(newsPage, DEFAULT_LIST_PAGE_SIZE, newsTotal);
  const mediaMeta = computeListPagination(mediaPage, DEFAULT_LIST_PAGE_SIZE, mediaTotal);

  const [recentNews, recentMedia] = await Promise.all([
    prisma.news.findMany({
      orderBy: { createdAt: "desc" },
      skip: newsMeta.skip,
      take: newsMeta.pageSize,
      include: { league: { select: { name: true, slug: true } } },
    }),
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      skip: mediaMeta.skip,
      take: mediaMeta.pageSize,
      include: { league: { select: { name: true, slug: true } } },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Модерация контента</h1>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Последние новости</h2>
        <div className="mt-4 space-y-3">
          {recentNews.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border-2 border-slate-200 bg-white shadow-sm p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {item.league.name} &middot; {item.hidden ? "Скрыто" : "Опубликовано"}
                </p>
              </div>
              {item.hidden && (
                <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">
                  Скрыто
                </span>
              )}
            </div>
          ))}
          {recentNews.length === 0 && (
            <p className="text-sm text-gray-400">Нет новостей</p>
          )}
        </div>
        <ListPagination
          meta={newsMeta}
          query={mediaMeta.page > 1 ? { mp: String(mediaMeta.page) } : undefined}
          className="mt-6"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Последние медиа</h2>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {recentMedia.map((item) => (
            <div key={item.id} className="rounded-xl border-2 border-slate-200 bg-white shadow-sm p-3">
              <p className="text-xs text-slate-600 truncate">{item.url}</p>
              <p className="text-xs text-slate-500 mt-1">
                {item.league.name} &middot; {item.type}
              </p>
              {item.hidden && (
                <span className="mt-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                  Скрыто
                </span>
              )}
            </div>
          ))}
          {recentMedia.length === 0 && (
            <p className="text-sm text-gray-400">Нет медиа</p>
          )}
        </div>
        <ListPagination
          meta={mediaMeta}
          query={newsMeta.page > 1 ? { page: String(newsMeta.page) } : undefined}
          className="mt-6"
        />
      </div>
    </div>
  );
}
