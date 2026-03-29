import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Users, UserCircle, Calendar, Inbox } from "lucide-react";
import { formatDateLong } from "@/lib/utils";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const [teamCount, playerCount, matchCount, pendingApps, upcomingMatches] =
    await Promise.all([
      prisma.team.count({ where: { leagueId: league.id, archivedAt: null } }),
      prisma.player.count({ where: { leagueId: league.id, archivedAt: null } }),
      prisma.match.count({ where: { leagueId: league.id } }),
      prisma.application.count({ where: { leagueId: league.id, status: "PENDING" } }),
      prisma.match.findMany({
        where: { leagueId: league.id, status: "SCHEDULED", archivedAt: null },
        orderBy: { datetime: "asc" },
        take: 5,
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      }),
    ]);

  const stats = [
    { label: "Команд", value: teamCount, icon: Users },
    { label: "Игроков", value: playerCount, icon: UserCircle },
    { label: "Матчей", value: matchCount, icon: Calendar },
    { label: "Заявок", value: pendingApps, icon: Inbox },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
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
        <h2 className="text-lg font-semibold text-gray-900">Ближайшие матчи</h2>
        <div className="mt-4 space-y-2">
          {upcomingMatches.map((m) => (
            <div key={m.id} className="rounded-lg border bg-white p-3 flex items-center justify-between text-sm">
              <span>{m.homeTeam.name} vs {m.awayTeam.name}</span>
              <span className="text-gray-500 text-xs">{formatDateLong(m.datetime)}</span>
            </div>
          ))}
          {upcomingMatches.length === 0 && (
            <p className="text-sm text-gray-400">Нет запланированных матчей</p>
          )}
        </div>
      </div>
    </div>
  );
}
