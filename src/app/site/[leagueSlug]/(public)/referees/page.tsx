import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function RefereesPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { leagueSlug } = await params;
  const { page: pageRaw } = await searchParams;
  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
  });

  if (!league) notFound();

  const page = parseListPage(pageRaw);
  const total = await prisma.referee.count({ where: { leagueId: league.id } });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const referees = await prisma.referee.findMany({
    where: { leagueId: league.id },
    orderBy: { lastName: "asc" },
    skip: meta.skip,
    take: meta.pageSize,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Судьи</h1>

      {referees.length === 0 ? (
        <p className="text-slate-600">Информация о судьях пока не добавлена.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {referees.map((referee) => (
              <div
                key={referee.id}
                className="surface-entity-card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {referee.photo ? (
                    <img
                      src={referee.photo}
                      alt={`${referee.firstName} ${referee.lastName}`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-500 text-xl font-bold">
                      {referee.firstName[0]}{referee.lastName[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">
                      {referee.lastName} {referee.firstName}
                    </p>
                    {referee.category && (
                      <p className="text-sm text-slate-600">
                        Категория: {referee.category}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ListPagination meta={meta} />
        </>
      )}
    </div>
  );
}
