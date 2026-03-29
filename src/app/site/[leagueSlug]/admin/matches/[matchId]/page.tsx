import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MatchProtocolForm } from "@/components/admin/match-protocol-form";
import { getSportConfig } from "@/lib/sport-config";
import { formatDateTime } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

const statusLabels: Record<string, string> = {
  SCHEDULED: "Запланирован",
  LIVE: "Идёт",
  FINISHED: "Завершён",
  POSTPONED: "Перенесён",
  CANCELLED: "Отменён",
};

export default async function AdminMatchDetailPage({
  params,
}: {
  params: Promise<{ leagueSlug: string; matchId: string }>;
}) {
  const { leagueSlug, matchId } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const match = await prisma.match.findFirst({
    where: { id: matchId, leagueId: league.id },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      tournament: { select: { seasonId: true, name: true } },
      events: true,
      penalties: true,
      goalieStats: true,
    },
  });
  if (!match) notFound();

  const seasonId = match.tournament.seasonId;
  const [homeRosters, awayRosters] = await Promise.all([
    prisma.teamRoster.findMany({
      where: { teamId: match.homeTeamId, seasonId },
      include: { player: { select: { id: true, firstName: true, lastName: true, role: true } } },
    }),
    prisma.teamRoster.findMany({
      where: { teamId: match.awayTeamId, seasonId },
      include: { player: { select: { id: true, firstName: true, lastName: true, role: true } } },
    }),
  ]);

  const homePlayers = homeRosters.map((r) => r.player);
  const awayPlayers = awayRosters.map((r) => r.player);
  const sportConfig = getSportConfig(league.sportType);

  const showProtocol = match.status !== "CANCELLED";

  const initialProtocol =
    match.status === "CANCELLED"
      ? null
      : {
          homeScore: match.homeScore ?? 0,
          awayScore: match.awayScore ?? 0,
          overtime: match.overtime,
          shootout: match.shootout,
          events: match.events.map((e) => ({
            type: e.type,
            playerId: e.playerId,
            teamId: e.teamId,
            period: e.period,
            time: e.time,
          })),
          penalties: match.penalties.map((p) => ({
            playerId: p.playerId,
            teamId: p.teamId,
            minutes: p.minutes,
            reason: p.reason,
            period: p.period,
            time: p.time,
          })),
          goalieStats: match.goalieStats.map((g) => ({
            playerId: g.playerId,
            saves: g.saves,
            shutout: g.shutout,
          })),
        };

  return (
    <div>
      <Link
        href="/admin/matches"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        К списку матчей
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {match.homeTeam.name} — {match.awayTeam.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {formatDateTime(match.datetime)} · {match.tournament.name} ·{" "}
            {statusLabels[match.status] ?? match.status}
          </p>
        </div>
        <Link
          href={`/matches/${match.id}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 shrink-0"
          target="_blank"
          rel="noopener noreferrer"
        >
          Как видят сайт лиги →
        </Link>
      </div>

      {homePlayers.length === 0 && awayPlayers.length === 0 && showProtocol && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          В составах команд на текущий сезон нет игроков — добавьте игроков и включите их в состав, чтобы
          заполнять протокол.
        </div>
      )}

      {match.status === "CANCELLED" && (
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm text-gray-600 text-sm">
          Матч отменён, протокол не заполняется.
        </div>
      )}

      {showProtocol && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {match.status === "FINISHED" ? "Редактирование результата и протокола" : "Протокол и результат"}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Сохранение заменяет весь протокол матча и пересчитывает турнирную таблицу.
          </p>
          <MatchProtocolForm
            matchId={match.id}
            homeTeamId={match.homeTeamId}
            awayTeamId={match.awayTeamId}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
            homePlayers={homePlayers}
            awayPlayers={awayPlayers}
            sportConfig={sportConfig}
            initialProtocol={initialProtocol}
            hasFinishedResult={match.status === "FINISHED"}
          />
        </div>
      )}
    </div>
  );
}
