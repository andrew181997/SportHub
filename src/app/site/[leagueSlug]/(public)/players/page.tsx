import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PlayersPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const players = await prisma.player.findMany({
    where: { leagueId: league.id, archivedAt: null },
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Игроки</h1>

      <div className="mt-6 rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Игрок</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Амплуа</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Команда</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {players.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/players/${p.id}`} className="font-medium text-blue-600 hover:underline">
                    {p.lastName} {p.firstName} {p.middleName ?? ""}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {p.role === "GOALIE" ? "Вратарь" : "Полевой"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {p.rosters[0]?.team.name ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
