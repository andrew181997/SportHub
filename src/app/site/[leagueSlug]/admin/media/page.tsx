import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AdminMediaPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const media = await prisma.media.findMany({
    where: { leagueId: league.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Медиа</h1>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((m) => (
          <div key={m.id} className="rounded-lg border bg-white overflow-hidden">
            {m.type === "PHOTO" ? (
              <img src={m.url} alt={m.caption ?? ""} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                Видео
              </div>
            )}
            <div className="p-3">
              <p className="text-xs text-gray-500 truncate">{m.caption ?? m.url}</p>
              <p className="text-xs text-gray-400 mt-1">{m.type}</p>
            </div>
          </div>
        ))}
      </div>

      {media.length === 0 && (
        <p className="mt-8 text-gray-400">Нет медиа</p>
      )}
    </div>
  );
}
