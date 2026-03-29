import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function LeaguesPage() {
  const leagues = await prisma.league.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { teams: true, matches: true, players: true } },
      members: { include: { user: { select: { email: true, status: true } } }, where: { role: "ADMIN" } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Все лиги</h1>
      <p className="mt-1 text-sm text-gray-500">
        {leagues.length} лиг на платформе
      </p>

      <div className="mt-6 rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Название</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Спорт</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Владелец</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Команд</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Игроков</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Матчей</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Создана</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leagues.map((league) => (
              <tr key={league.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{league.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-blue-600">
                  <a href={`http://${league.slug}.sporthub.ru`} target="_blank" rel="noreferrer">
                    {league.slug}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-500">{league.sportType}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {league.members[0]?.user.email ?? "—"}
                  {league.members[0]?.user.status === "BLOCKED" && (
                    <span className="ml-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                      заблокирован
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{league._count.teams}</td>
                <td className="px-4 py-3 text-right text-gray-500">{league._count.players}</td>
                <td className="px-4 py-3 text-right text-gray-500">{league._count.matches}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(league.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
