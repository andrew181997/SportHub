import { prisma } from "@/lib/prisma";
import { Users, Shield, Trophy, Calendar } from "lucide-react";

export default async function SuperadminDashboard() {
  const [leagueCount, userCount, matchCount, recentLeagues] =
    await Promise.all([
      prisma.league.count(),
      prisma.user.count(),
      prisma.match.count(),
      prisma.league.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          _count: { select: { teams: true, matches: true } },
        },
      }),
    ]);

  const stats = [
    { label: "Лиг", value: leagueCount, icon: Shield },
    { label: "Пользователей", value: userCount, icon: Users },
    { label: "Матчей", value: matchCount, icon: Calendar },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Дашборд платформы</h1>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <s.icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Последние лиги
        </h2>
        <div className="mt-4 rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Название
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Slug
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Спорт
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  Команд
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  Матчей
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentLeagues.map((league) => (
                <tr key={league.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {league.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {league.slug}.sporthub.ru
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {league.sportType}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {league._count.teams}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {league._count.matches}
                  </td>
                </tr>
              ))}
              {recentLeagues.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Нет лиг
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
