import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AdminTournamentsPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const [seasons, tournaments] = await Promise.all([
    prisma.season.findMany({ where: { leagueId: league.id }, orderBy: { startDate: "desc" } }),
    prisma.tournament.findMany({
      where: { leagueId: league.id },
      include: {
        season: { select: { name: true } },
        _count: { select: { matches: true, groups: true } },
      },
      orderBy: { season: { startDate: "desc" } },
    }),
  ]);

  const typeLabels: Record<string, string> = {
    REGULAR: "Регулярный",
    PLAYOFF: "Плей-офф",
    GROUP_STAGE: "Групповой",
    CUP: "Кубок",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Турниры</h1>
      </div>

      <div className="mt-6 rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Название</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Тип</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Сезон</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Матчей</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tournaments.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-gray-500">{typeLabels[t.type]}</td>
                <td className="px-4 py-3 text-gray-500">{t.season.name}</td>
                <td className="px-4 py-3 text-right text-gray-500">{t._count.matches}</td>
                <td className="px-4 py-3">
                  {t.archivedAt ? (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Архив</span>
                  ) : (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Активный</span>
                  )}
                </td>
              </tr>
            ))}
            {tournaments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Нет турниров. Создайте первый турнир.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
