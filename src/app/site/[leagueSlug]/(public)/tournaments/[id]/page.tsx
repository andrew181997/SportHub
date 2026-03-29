import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDateLong } from "@/lib/utils";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ leagueSlug: string; id: string }>;
}) {
  const { leagueSlug, id } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const tournament = await prisma.tournament.findUnique({
    where: { id, leagueId: league.id },
    include: {
      season: true,
      standings: {
        include: { team: { select: { name: true } } },
        orderBy: [{ points: "desc" }, { goalsFor: "desc" }],
      },
      matches: {
        where: { archivedAt: null },
        orderBy: { datetime: "desc" },
        take: 20,
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      },
    },
  });

  if (!tournament) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
      <p className="text-gray-500">{tournament.season.name}</p>

      {tournament.standings.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Таблица</h2>
          <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-8">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Команда</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">И</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">В</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">П</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">ЗШ-ПШ</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500 font-bold">О</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tournament.standings.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.team.name}</td>
                    <td className="text-center px-3 py-3 text-gray-500">{s.gamesPlayed}</td>
                    <td className="text-center px-3 py-3 text-gray-500">{s.wins}</td>
                    <td className="text-center px-3 py-3 text-gray-500">{s.losses}</td>
                    <td className="text-center px-3 py-3 text-gray-500">
                      {s.goalsFor}-{s.goalsAgainst}
                    </td>
                    <td className="text-center px-3 py-3 font-bold text-gray-900">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Матчи</h2>
        <div className="space-y-2">
          {tournament.matches.map((m) => (
            <div key={m.id} className="rounded-lg border bg-white p-3 flex items-center justify-between text-sm">
              <span className="flex-1 text-right font-medium">{m.homeTeam.name}</span>
              <span className="px-3 font-bold">
                {m.status === "FINISHED"
                  ? `${m.homeScore} : ${m.awayScore}`
                  : formatDateLong(m.datetime)}
              </span>
              <span className="flex-1 font-medium">{m.awayTeam.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
