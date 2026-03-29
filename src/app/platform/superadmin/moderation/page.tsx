import { prisma } from "@/lib/prisma";

export default async function ModerationPage() {
  const [recentNews, recentMedia] = await Promise.all([
    prisma.news.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { league: { select: { name: true, slug: true } } },
    }),
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
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
            <div key={item.id} className="rounded-lg border bg-white p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">
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
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Последние медиа</h2>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {recentMedia.map((item) => (
            <div key={item.id} className="rounded-lg border bg-white p-3">
              <p className="text-xs text-gray-500 truncate">{item.url}</p>
              <p className="text-xs text-gray-400 mt-1">
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
      </div>
    </div>
  );
}
