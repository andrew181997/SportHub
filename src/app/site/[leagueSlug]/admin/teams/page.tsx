import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AdminTeamsPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const teams = await prisma.team.findMany({
    where: { leagueId: league.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { rosters: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Команды</h1>
      </div>

      <div className="mt-6 rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Название</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Город</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Игроков</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{team.name}</td>
                <td className="px-4 py-3 text-gray-500">{team.city ?? "—"}</td>
                <td className="px-4 py-3 text-right text-gray-500">{team._count.rosters}</td>
                <td className="px-4 py-3">
                  {team.archivedAt ? (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Архив</span>
                  ) : (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Активная</span>
                  )}
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Нет команд
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
