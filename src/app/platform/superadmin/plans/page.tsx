import { prisma } from "@/lib/prisma";

export default async function PlansPage() {
  const plans = await prisma.leaguePlan.findMany({
    include: { league: { select: { name: true, slug: true } } },
    orderBy: { league: { name: "asc" } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Тарифы и лимиты</h1>

      <div className="mt-6 rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Лига</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Макс. команд</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Макс. игроков</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Хранилище (МБ)</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Макс. турниров</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{plan.league.name}</td>
                <td className="px-4 py-3 text-right text-gray-500">{plan.maxTeams}</td>
                <td className="px-4 py-3 text-right text-gray-500">{plan.maxPlayers}</td>
                <td className="px-4 py-3 text-right text-gray-500">{plan.maxStorageMb}</td>
                <td className="px-4 py-3 text-right text-gray-500">{plan.maxTournaments}</td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Нет тарифов
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
