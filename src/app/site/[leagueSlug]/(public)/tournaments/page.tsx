import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function TournamentsPage({
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
  const total = await prisma.tournament.count({
    where: { leagueId: league.id, archivedAt: null },
  });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const tournaments = await prisma.tournament.findMany({
    where: { leagueId: league.id, archivedAt: null },
    include: {
      season: { select: { name: true } },
      _count: { select: { matches: true, groups: true } },
    },
    orderBy: { season: { startDate: "desc" } },
    skip: meta.skip,
    take: meta.pageSize,
  });

  const typeLabels: Record<string, string> = {
    REGULAR: "Регулярный чемпионат",
    PLAYOFF: "Плей-офф",
    GROUP_STAGE: "Групповой этап",
    CUP: "Кубок",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Турниры</h1>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {tournaments.map((t) => (
          <Link
            key={t.id}
            href={`/tournaments/${t.id}`}
            className="surface-entity-card p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="font-semibold text-slate-900 text-lg">{t.name}</h3>
            <p className="text-sm text-slate-600 mt-1">
              {typeLabels[t.type]} &middot; {t.season.name}
            </p>
            <div className="mt-4 flex gap-4 text-xs text-slate-500">
              <span>{t._count.matches} матчей</span>
              {t._count.groups > 0 && <span>{t._count.groups} групп</span>}
            </div>
          </Link>
        ))}
      </div>

      <ListPagination meta={meta} />

      {tournaments.length === 0 && (
        <p className="mt-8 text-slate-500">Нет турниров</p>
      )}
    </div>
  );
}
