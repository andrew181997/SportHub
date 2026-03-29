import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function MediaPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const media = await prisma.media.findMany({
    where: { leagueId: league.id, hidden: false },
    orderBy: { createdAt: "desc" },
  });

  const photos = media.filter((m) => m.type === "PHOTO");
  const videos = media.filter((m) => m.type === "VIDEO");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Медиа</h1>

      {photos.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Фотогалерея</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="rounded-lg overflow-hidden border">
                <img src={p.url} alt={p.caption ?? ""} className="w-full h-48 object-cover" />
                {p.caption && (
                  <p className="p-2 text-xs text-gray-500">{p.caption}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Видео</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((v) => (
              <div key={v.id} className="rounded-lg border overflow-hidden">
                <div className="aspect-video">
                  <iframe
                    src={v.url}
                    className="w-full h-full"
                    allowFullScreen
                    title={v.caption ?? "Video"}
                  />
                </div>
                {v.caption && (
                  <p className="p-3 text-sm text-gray-600">{v.caption}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {media.length === 0 && (
        <p className="mt-8 text-gray-400">Нет медиа</p>
      )}
    </div>
  );
}
