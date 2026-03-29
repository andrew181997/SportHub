import { prisma } from "./prisma";
import type { SportType } from "@prisma/client";

interface PointsConfig {
  win: number;
  loss: number;
  draw: number;
  overtimeWin: number;
  overtimeLoss: number;
}

const POINTS_CONFIG: Record<SportType, PointsConfig> = {
  HOCKEY: { win: 3, loss: 0, draw: 0, overtimeWin: 2, overtimeLoss: 1 },
  FOOTBALL: { win: 3, loss: 0, draw: 1, overtimeWin: 3, overtimeLoss: 0 },
  BASKETBALL: { win: 2, loss: 1, draw: 0, overtimeWin: 2, overtimeLoss: 1 },
  VOLLEYBALL: { win: 3, loss: 0, draw: 0, overtimeWin: 2, overtimeLoss: 1 },
  OTHER: { win: 3, loss: 0, draw: 1, overtimeWin: 2, overtimeLoss: 1 },
};

export async function recalculateStandings(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      league: { select: { sportType: true } },
      matches: {
        where: { status: "FINISHED", archivedAt: null },
        select: {
          homeTeamId: true,
          awayTeamId: true,
          homeScore: true,
          awayScore: true,
          overtime: true,
          shootout: true,
          groupId: true,
        },
      },
    },
  });

  if (!tournament) return;

  const config = POINTS_CONFIG[tournament.league.sportType];
  const stats = new Map<
    string,
    {
      teamId: string;
      groupId: string | null;
      gamesPlayed: number;
      wins: number;
      losses: number;
      draws: number;
      overtimeWins: number;
      overtimeLosses: number;
      goalsFor: number;
      goalsAgainst: number;
      points: number;
    }
  >();

  function getTeamStats(teamId: string, groupId: string | null) {
    const key = teamId;
    if (!stats.has(key)) {
      stats.set(key, {
        teamId,
        groupId,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        overtimeWins: 0,
        overtimeLosses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      });
    }
    return stats.get(key)!;
  }

  for (const match of tournament.matches) {
    if (match.homeScore === null || match.awayScore === null) continue;

    const home = getTeamStats(match.homeTeamId, match.groupId);
    const away = getTeamStats(match.awayTeamId, match.groupId);
    const isOT = match.overtime || match.shootout;

    home.gamesPlayed++;
    away.gamesPlayed++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      if (isOT) {
        home.overtimeWins++;
        away.overtimeLosses++;
        home.points += config.overtimeWin;
        away.points += config.overtimeLoss;
      } else {
        home.wins++;
        away.losses++;
        home.points += config.win;
        away.points += config.loss;
      }
    } else if (match.awayScore > match.homeScore) {
      if (isOT) {
        away.overtimeWins++;
        home.overtimeLosses++;
        away.points += config.overtimeWin;
        home.points += config.overtimeLoss;
      } else {
        away.wins++;
        home.losses++;
        away.points += config.win;
        home.points += config.loss;
      }
    } else {
      home.draws++;
      away.draws++;
      home.points += config.draw;
      away.points += config.draw;
    }
  }

  await prisma.$transaction([
    prisma.standing.deleteMany({ where: { tournamentId } }),
    ...Array.from(stats.values()).map((s) =>
      prisma.standing.create({
        data: {
          teamId: s.teamId,
          tournamentId,
          groupId: s.groupId,
          gamesPlayed: s.gamesPlayed,
          wins: s.wins,
          losses: s.losses,
          draws: s.draws,
          overtimeWins: s.overtimeWins,
          overtimeLosses: s.overtimeLosses,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          points: s.points,
        },
      })
    ),
  ]);
}
