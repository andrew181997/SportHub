import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function AdminMediaPage({
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
  const total = await prisma.media.count({ where });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const media = await prisma.media.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: meta.skip,
    take: meta.pageSize,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Медиа</h1>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((m) => (
          <div key={m.id} className="rounded-xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
            {m.type === "PHOTO" ? (
              <img src={m.url} alt={m.caption ?? ""} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-sm text-slate-500 border-b border-slate-200">
                Видео
              </div>
            )}
            <div className="p-3">
              <p className="text-xs text-slate-600 truncate">{m.caption ?? m.url}</p>
              <p className="text-xs text-slate-400 mt-1">{m.type}</p>
            </div>
          </div>
        ))}
      </div>

      <ListPagination meta={meta} className="mt-6" />

      {media.length === 0 && (
        <p className="mt-8 text-gray-400">Нет медиа</p>
      )}
    </div>
  );
}
