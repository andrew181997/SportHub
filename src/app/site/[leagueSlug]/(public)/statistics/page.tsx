import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  getLeagueStatistics,
  isStatSortBy,
  type StatSortBy,
} from "@/lib/league-stats";
import {
  LeagueStatisticsFilters,
  LeagueStatisticsTable,
} from "@/components/league-statistics-view";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

/** Без ISR: иначе при смене ?by= / ?tournament= возможны 304 и устаревшая таблица. */
export const dynamic = "force-dynamic";

export default async function PublicStatisticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();
  const { leagueSlug } = await params;
  const sp = await searchParams;
  const byRaw = typeof sp.by === "string" ? sp.by : undefined;
  const sortBy: StatSortBy = isStatSortBy(byRaw) ? byRaw : "goals";
  const tournamentRaw = typeof sp.tournament === "string" ? sp.tournament : "all";
  const page = parseListPage(typeof sp.page === "string" ? sp.page : undefined);

  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const tournaments = await prisma.tournament.findMany({
    where: { leagueId: league.id, archivedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const tournamentId =
    tournamentRaw !== "all" && tournaments.some((t) => t.id === tournamentRaw)
      ? tournamentRaw
      : undefined;

  const allRows = await getLeagueStatistics(league.id, tournamentId, sortBy);
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, allRows.length);
  const rows = allRows.slice(meta.skip, meta.skip + meta.pageSize);

  const statQuery: Record<string, string | undefined> = {
    by: sortBy,
    tournament: tournamentId ?? "all",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Статистика</h1>
      <p className="mt-2 text-sm text-slate-700 max-w-3xl">
        Показатели по протоколам завершённых матчей. Выберите критерий сортировки и при
        необходимости ограничьте выборку турниром.
      </p>

      <div className="mt-6">
        <LeagueStatisticsFilters
          sortBy={sortBy}
          tournamentId={tournamentId}
          tournaments={tournaments}
        />
        <LeagueStatisticsTable rows={rows} sortBy={sortBy} rowOffset={meta.skip} />
        <ListPagination meta={meta} query={statQuery} />
      </div>
    </div>
  );
}
