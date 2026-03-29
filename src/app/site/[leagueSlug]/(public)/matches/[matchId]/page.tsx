import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { MatchProtocolDisplay } from "@/components/match/match-protocol-display";

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
            select: { firstName: true, lastName: true, middleName: true },
          },
        },
      },
      penalties: {
        include: {
          player: {
            select: { firstName: true, lastName: true, middleName: true },
          },
        },
      },
      goalieStats: {
        include: {
          player: {
            select: { firstName: true, lastName: true, middleName: true },
          },
        },
      },
    },
  });

  if (!match) notFound();

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
      />
    </div>
  );
}
