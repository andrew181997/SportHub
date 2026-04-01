import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function CoachesPage({
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
  const total = await prisma.coach.count({ where: { leagueId: league.id } });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const coaches = await prisma.coach.findMany({
    where: { leagueId: league.id },
    include: { team: { select: { name: true, logo: true } } },
    orderBy: { lastName: "asc" },
    skip: meta.skip,
    take: meta.pageSize,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Тренеры</h1>

      {coaches.length === 0 ? (
        <p className="text-slate-600">Информация о тренерах пока не добавлена.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coaches.map((coach) => (
              <div
                key={coach.id}
                className="surface-entity-card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {coach.photo ? (
                    <img
                      src={coach.photo}
                      alt={`${coach.firstName} ${coach.lastName}`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-500 text-xl font-bold">
                      {coach.firstName[0]}{coach.lastName[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">
                      {coach.lastName} {coach.firstName}
                    </p>
                    {coach.team && (
                      <p className="text-sm text-slate-600">{coach.team.name}</p>
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
