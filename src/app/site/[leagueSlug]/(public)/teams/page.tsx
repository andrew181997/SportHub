import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const teams = await prisma.team.findMany({
    where: { leagueId: league.id, archivedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { rosters: true } } },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Команды</h1>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.id}`}
            className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400">
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  team.name.charAt(0)
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{team.name}</h3>
                {team.city && (
                  <p className="text-sm text-gray-500">{team.city}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              {team._count.rosters} игроков в составе
            </div>
          </Link>
        ))}
      </div>

      {teams.length === 0 && (
        <p className="mt-8 text-gray-400">Нет команд</p>
      )}
    </div>
  );
}
