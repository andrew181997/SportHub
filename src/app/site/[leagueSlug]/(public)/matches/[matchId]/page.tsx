import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { MatchProtocolDisplay } from "@/components/match/match-protocol-display";
import { PlayoffSeriesStatus } from "@/components/match/playoff-series-status";
import { computeSeriesScore, loadPlayoffSeriesForMatchDetail } from "@/lib/playoff-series";

export const revalidate = 30;

export default async function PublicMatchPage({
  params,
}: {
  params: Promise<{ leagueSlug: string; matchId: string }>;
}) {
  const { leagueSlug, matchId } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const match = await prisma.match.findFirst({
    where: { id: matchId, leagueId: league.id, archivedAt: null },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      tournament: { select: { name: true } },
      events: {
        include: {
          player: {
            select: { id: true, firstName: true, lastName: true, middleName: true },
          },
        },
      },
      penalties: {
        include: {
          player: {
            select: { id: true, firstName: true, lastName: true, middleName: true },
          },
        },
      },
      goalieStats: {
        include: {
          player: {
            select: { id: true, firstName: true, lastName: true, middleName: true },
          },
        },
      },
      matchReferees: {
        orderBy: { sortOrder: "asc" },
        include: {
          referee: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!match) notFound();

  const playoffSeries = await loadPlayoffSeriesForMatchDetail(match.playoffSeriesId);

  const seriesScore = playoffSeries
    ? computeSeriesScore({
        teamAId: playoffSeries.teamAId,
        teamBId: playoffSeries.teamBId,
        winsToWin: playoffSeries.winsToWin,
        winnerTeamId: playoffSeries.winnerTeamId,
        winnerDeterminedManually: playoffSeries.winnerDeterminedManually,
        matches: playoffSeries.matches,
      })
    : null;

  const seriesWinnerName =
    seriesScore?.winnerTeamId != null && playoffSeries
      ? seriesScore.winnerTeamId === playoffSeries.teamAId
        ? playoffSeries.teamA.name
        : playoffSeries.teamB.name
      : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 text-sm">
        <Link
          href="/results"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="w-4 h-4" />
          Результаты
        </Link>
        <Link href="/calendar" className="text-blue-600 hover:text-blue-800">
          Календарь
        </Link>
        <Link href="/" className="text-gray-500 hover:text-gray-800">
          Главная
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Матч</h1>

      {playoffSeries && seriesScore ? (
        <div className="mb-6">
          <PlayoffSeriesStatus
            teamAName={playoffSeries.teamA.name}
            teamBName={playoffSeries.teamB.name}
            winsA={seriesScore.winsA}
            winsB={seriesScore.winsB}
            winsToWin={seriesScore.winsToWin}
            winnerName={seriesWinnerName}
          />
        </div>
      ) : null}

      <MatchProtocolDisplay
        sportType={league.sportType}
        status={match.status}
        datetime={match.datetime}
        venue={match.venue}
        tournamentName={match.tournament.name}
        homeTeamId={match.homeTeamId}
        homeTeamName={match.homeTeam.name}
        awayTeamName={match.awayTeam.name}
        homeScore={match.homeScore}
        awayScore={match.awayScore}
        overtime={match.overtime}
        shootout={match.shootout}
        events={match.events.map((e) => ({
          id: e.id,
          type: e.type,
          period: e.period,
          time: e.time,
          teamId: e.teamId,
          player: e.player,
        }))}
        penalties={match.penalties.map((p) => ({
          id: p.id,
          minutes: p.minutes,
          reason: p.reason,
          period: p.period,
          time: p.time,
          teamId: p.teamId,
          player: p.player,
        }))}
        goalieStats={match.goalieStats.map((g) => ({
          teamId: g.teamId,
          saves: g.saves,
          goalsAgainst: g.goalsAgainst,
          shutout: g.shutout,
          player: g.player,
        }))}
        referees={match.matchReferees.map((mr) => ({
          firstName: mr.referee.firstName,
          lastName: mr.referee.lastName,
          role: mr.role,
        }))}
      />
    </div>
  );
}
