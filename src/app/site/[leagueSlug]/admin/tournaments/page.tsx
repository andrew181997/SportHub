import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TournamentCreateForm } from "@/components/admin/tournament-create-form";
import { TournamentTeamsCell } from "@/components/admin/tournament-teams-cell";

export default async function AdminTournamentsPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const [tournaments, leagueTeams] = await Promise.all([
    prisma.tournament.findMany({
      where: { leagueId: league.id },
      include: {
        _count: { select: { matches: true, groups: true } },
        standings: {
          include: { team: { select: { id: true, name: true } } },
          orderBy: { team: { name: "asc" } },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({
      where: { leagueId: league.id, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const leagueTeamsForCell = leagueTeams.map((t) => ({ id: t.id, name: t.name }));

  const typeLabels: Record<string, string> = {
    REGULAR: "Регулярный",
    PLAYOFF: "Плей-офф",
    GROUP_STAGE: "Групповой",
    CUP: "Кубок",
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Турниры</h1>
        <TournamentCreateForm />
      </div>

      <div className="mt-6 rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-14" />
              <th className="text-left px-4 py-3 font-medium text-gray-500">Название</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Тип</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Команды в турнире</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Матчей</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tournaments.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 w-14">
                  {t.emblem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.emblem}
                      alt=""
                      className="h-9 w-9 rounded-md border border-gray-100 object-contain bg-white"
                    />
                  ) : (
                    <span className="inline-block h-9 w-9 rounded-md bg-gray-100" />
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-gray-500">{typeLabels[t.type]}</td>
                <td className="px-4 py-3 align-top">
                  <TournamentTeamsCell
                    tournamentId={t.id}
                    archived={Boolean(t.archivedAt)}
                    members={t.standings.map((s) => ({
                      id: s.team.id,
                      name: s.team.name,
                    }))}
                    leagueTeams={leagueTeamsForCell}
                  />
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{t._count.matches}</td>
                <td className="px-4 py-3">
                  {t.archivedAt ? (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Архив</span>
                  ) : (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Активный</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/tournaments/${t.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Таблица и статистика
                  </Link>
                </td>
              </tr>
            ))}
            {tournaments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
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
