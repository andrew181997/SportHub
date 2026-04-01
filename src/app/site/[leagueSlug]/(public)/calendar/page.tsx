import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDateLong } from "@/lib/utils";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function CalendarPage({
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
  const where: Prisma.MatchWhereInput = {
    leagueId: league.id,
    archivedAt: null,
    status: { in: ["SCHEDULED", "LIVE"] },
  };
  const total = await prisma.match.count({ where });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const matches = await prisma.match.findMany({
    where,
    orderBy: { datetime: "asc" },
    skip: meta.skip,
    take: meta.pageSize,
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      tournament: { select: { name: true } },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Календарь матчей</h1>

      <div className="mt-6 space-y-3">
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/matches/${m.id}`}
            className="surface-match p-4 flex items-center justify-between hover:border-blue-400/80 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="text-sm font-semibold text-slate-900 flex-1 text-right truncate">
                {m.homeTeam.name}
              </span>
              <span className="text-xs px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-600 shrink-0 font-medium">
                VS
              </span>
              <span className="text-sm font-semibold text-slate-900 flex-1 truncate">
                {m.awayTeam.name}
              </span>
            </div>
            <div className="text-right ml-4 shrink-0">
              <p className="text-xs text-slate-600">{formatDateLong(m.datetime)}</p>
              <p className="text-xs text-slate-500">{m.tournament.name}</p>
              {m.status === "LIVE" && (
                <span className="inline-block mt-1 rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-xs text-red-800 animate-pulse">
                  LIVE
                </span>
              )}
              <p className="text-xs text-blue-700 mt-1 font-medium">Карточка матча →</p>
            </div>
          </Link>
        ))}
        {matches.length === 0 && (
          <p className="text-slate-500 py-8 text-center">Нет запланированных матчей</p>
        )}
      </div>

      <ListPagination meta={meta} />
    </div>
  );
}
