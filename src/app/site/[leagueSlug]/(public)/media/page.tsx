import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function MediaPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueSlug: string }>;
  searchParams: Promise<{ page?: string; vp?: string }>;
}) {
  const { leagueSlug } = await params;
  const sp = await searchParams;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const photoPage = parseListPage(sp.page);
  const videoPage = parseListPage(sp.vp);

  const photoWhere = { leagueId: league.id, hidden: false, type: "PHOTO" as const };
  const videoWhere = { leagueId: league.id, hidden: false, type: "VIDEO" as const };

  const [photoTotal, videoTotal] = await Promise.all([
    prisma.media.count({ where: photoWhere }),
    prisma.media.count({ where: videoWhere }),
  ]);

  const photoMeta = computeListPagination(photoPage, DEFAULT_LIST_PAGE_SIZE, photoTotal);
  const videoMeta = computeListPagination(videoPage, DEFAULT_LIST_PAGE_SIZE, videoTotal);

  const [photos, videos] = await Promise.all([
    prisma.media.findMany({
      where: photoWhere,
      orderBy: { createdAt: "desc" },
      skip: photoMeta.skip,
      take: photoMeta.pageSize,
    }),
    prisma.media.findMany({
      where: videoWhere,
      orderBy: { createdAt: "desc" },
      skip: videoMeta.skip,
      take: videoMeta.pageSize,
    }),
  ]);

  const hasAny = photoTotal > 0 || videoTotal > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Медиа</h1>

      {photoTotal > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Фотогалерея</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="surface-entity-card overflow-hidden">
                <img src={p.url} alt={p.caption ?? ""} className="w-full h-48 object-cover" />
                {p.caption && (
                  <p className="p-2 text-xs text-slate-600 border-t border-slate-200">{p.caption}</p>
                )}
              </div>
            ))}
          </div>
          <ListPagination
            meta={photoMeta}
            query={videoMeta.page > 1 ? { vp: String(videoMeta.page) } : undefined}
          />
        </section>
      )}

      {videoTotal > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Видео</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((v) => (
              <div key={v.id} className="surface-entity-card overflow-hidden">
                <div className="aspect-video bg-slate-100">
                  <iframe
                    src={v.url}
                    className="w-full h-full"
                    allowFullScreen
                    title={v.caption ?? "Video"}
                  />
                </div>
                {v.caption && (
                  <p className="p-3 text-sm text-slate-700 border-t border-slate-200">{v.caption}</p>
                )}
              </div>
            ))}
          </div>
          <ListPagination
            meta={videoMeta}
            query={photoMeta.page > 1 ? { page: String(photoMeta.page) } : undefined}
          />
        </section>
      )}

      {!hasAny && (
        <p className="mt-8 text-slate-500">Нет медиа</p>
      )}
    </div>
  );
}
