import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function TournamentsPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const tournaments = await prisma.tournament.findMany({
    where: { leagueId: league.id, archivedAt: null },
    include: {
      season: { select: { name: true } },
      _count: { select: { matches: true, groups: true } },
    },
    orderBy: { season: { startDate: "desc" } },
  });

  const typeLabels: Record<string, string> = {
    REGULAR: "Регулярный чемпионат",
    PLAYOFF: "Плей-офф",
    GROUP_STAGE: "Групповой этап",
    CUP: "Кубок",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Турниры</h1>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {tournaments.map((t) => (
          <Link
            key={t.id}
            href={`/tournaments/${t.id}`}
            className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 text-lg">{t.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {typeLabels[t.type]} &middot; {t.season.name}
            </p>
            <div className="mt-4 flex gap-4 text-xs text-gray-400">
              <span>{t._count.matches} матчей</span>
              {t._count.groups > 0 && <span>{t._count.groups} групп</span>}
            </div>
          </Link>
        ))}
      </div>

      {tournaments.length === 0 && (
        <p className="mt-8 text-gray-400">Нет турниров</p>
      )}
    </div>
  );
}
