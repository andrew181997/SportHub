import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AdminPlayersPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const players = await prisma.player.findMany({
    where: { leagueId: league.id },
    orderBy: { lastName: "asc" },
    include: {
      rosters: {
        take: 1,
        orderBy: { season: { startDate: "desc" } },
        include: { team: { select: { name: true } } },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Игроки</h1>
      </div>

      <div className="mt-6 rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Фамилия Имя</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Амплуа</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Команда</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {players.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {p.lastName} {p.firstName}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {p.role === "GOALIE" ? "Вратарь" : "Полевой"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {p.rosters[0]?.team.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {p.archivedAt ? (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Архив</span>
                  ) : (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Активный</span>
                  )}
                </td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Нет игроков
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
