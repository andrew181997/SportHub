import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function TeamsPage({
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
  const total = await prisma.team.count({
    where: { leagueId: league.id, archivedAt: null },
  });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const teams = await prisma.team.findMany({
    where: { leagueId: league.id, archivedAt: null },
    orderBy: { name: "asc" },
    skip: meta.skip,
    take: meta.pageSize,
    include: { _count: { select: { rosters: true } } },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Команды</h1>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.id}`}
            className="surface-entity-card p-6 hover:shadow-lg hover:border-slate-400/90 transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500">
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  team.name.charAt(0)
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{team.name}</h3>
                {team.city && (
                  <p className="text-sm text-slate-600">{team.city}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">
              <Users className="w-3 h-3" />
              {team._count.rosters} игроков в составе
            </div>
          </Link>
        ))}
      </div>

      <ListPagination meta={meta} />

      {teams.length === 0 && (
        <p className="mt-8 text-slate-500">Нет команд</p>
      )}
    </div>
  );
}
