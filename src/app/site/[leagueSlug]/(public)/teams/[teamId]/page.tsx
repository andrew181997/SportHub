import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ leagueSlug: string; teamId: string }>;
}) {
  const { leagueSlug, teamId } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const team = await prisma.team.findUnique({
    where: { id: teamId, leagueId: league.id },
    include: {
      rosters: {
        include: {
          player: { select: { id: true, firstName: true, lastName: true, photo: true, role: true } },
          season: { select: { name: true } },
        },
      },
      coaches: { select: { id: true, firstName: true, lastName: true, photo: true } },
    },
  });

  if (!team) notFound();

  const recentMatches = await prisma.match.findMany({
    where: {
      leagueId: league.id,
      status: "FINISHED",
      archivedAt: null,
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    orderBy: { datetime: "desc" },
    take: 10,
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400">
          {team.logo ? (
            <img src={team.logo} alt={team.name} className="w-full h-full rounded-2xl object-cover" />
          ) : (
            team.name.charAt(0)
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          {team.city && <p className="text-gray-500">{team.city}</p>}
          {team.foundedYear && (
            <p className="text-sm text-gray-400">Основана в {team.foundedYear}</p>
          )}
        </div>
      </div>

      {team.description && (
        <p className="text-gray-600 mb-8">{team.description}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Состав</h2>
          <div className="surface-table-wrap">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Игрок</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Позиция</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">№</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {team.rosters.map((r) => (
                  <tr key={r.id} className="surface-player-row">
                    <td className="px-4 py-3">
                      <Link href={`/players/${r.player.id}`} className="font-medium text-blue-600 hover:underline">
                        {r.player.lastName} {r.player.firstName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.position ?? "—"}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{r.number ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Последние матчи</h2>
          <div className="space-y-2">
            {recentMatches.map((m) => (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className="surface-match p-3 flex items-center justify-between text-sm hover:border-blue-400/80 transition-colors"
              >
                <span className={m.homeTeamId === teamId ? "font-bold truncate pr-2" : "truncate pr-2"}>
                  {m.homeTeam.name}
                </span>
                <span className="font-bold px-3 shrink-0 tabular-nums">{m.homeScore}:{m.awayScore}</span>
                <span className={m.awayTeamId === teamId ? "font-bold truncate pl-2" : "truncate pl-2"}>
                  {m.awayTeam.name}
                </span>
              </Link>
            ))}
            {recentMatches.length === 0 && (
              <p className="text-sm text-gray-400">Нет матчей</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
