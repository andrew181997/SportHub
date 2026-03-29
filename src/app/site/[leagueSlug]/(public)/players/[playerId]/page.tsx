import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ leagueSlug: string; playerId: string }>;
}) {
  const { leagueSlug, playerId } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const player = await prisma.player.findUnique({
    where: { id: playerId, leagueId: league.id },
    include: {
      rosters: {
        include: {
          team: { select: { id: true, name: true } },
          season: { select: { name: true } },
        },
        orderBy: { season: { startDate: "desc" } },
      },
    },
  });

  if (!player) notFound();

  const [goals, assists, penalties] = await Promise.all([
    prisma.matchEvent.count({ where: { playerId, type: "GOAL" } }),
    prisma.matchEvent.count({ where: { playerId, type: "ASSIST" } }),
    prisma.penalty.aggregate({ where: { playerId }, _sum: { minutes: true } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400 overflow-hidden">
          {player.photo ? (
            <img src={player.photo} alt="" className="w-full h-full object-cover" />
          ) : (
            `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {player.lastName} {player.firstName} {player.middleName ?? ""}
          </h1>
          <p className="text-gray-500">
            {player.role === "GOALIE" ? "Вратарь" : "Полевой игрок"}
          </p>
          {player.birthDate && (
            <p className="text-sm text-gray-400">
              Дата рождения: {formatDate(player.birthDate)}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{goals}</p>
          <p className="text-sm text-gray-500">Голы</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{assists}</p>
          <p className="text-sm text-gray-500">Передачи</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{penalties._sum.minutes ?? 0}</p>
          <p className="text-sm text-gray-500">Штраф (мин)</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">История команд</h2>
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Сезон</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Команда</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Номер</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Позиция</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {player.rosters.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-gray-500">{r.season.name}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.team.name}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{r.number ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{r.position ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
