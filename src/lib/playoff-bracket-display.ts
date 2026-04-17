import { computeSeriesScore } from "@/lib/playoff-series";

/** Подписи колонок сетки (слева направо к финалу). */
export function getPlayoffColumnLabel(columnIndex: number, maxColumn: number): string {
  if (maxColumn <= 0) return "Плей-офф";
  if (columnIndex === maxColumn) return "Финал";
  if (columnIndex === maxColumn - 1 && maxColumn >= 2) return "Полуфинал";
  if (columnIndex === maxColumn - 2 && maxColumn >= 3) return "Четвертьфинал";
  return `Этап ${columnIndex + 1}`;
}

export type PlayoffSeriesForBracket = {
  id: string;
  label: string | null;
  bracketColumn: number;
  bracketRow: number;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  winsToWin: number;
  winsA: number;
  winsB: number;
  winnerTeamId: string | null;
};

/** Строка серии из БД с командами и матчами для отображения сетки. */
export type PlayoffSeriesDbRow = {
  id: string;
  tournamentId: string;
  label: string | null;
  bracketColumn?: number | null;
  bracketRow?: number | null;
  teamAId: string;
  teamBId: string;
  winsToWin: number;
  winnerTeamId: string | null;
  winnerDeterminedManually?: boolean | null;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  matches: Array<{
    status: string;
    archivedAt: Date | null;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
  }>;
};

export function mapSeriesToBracketItem(s: PlayoffSeriesDbRow): PlayoffSeriesForBracket {
  const score = computeSeriesScore({
    teamAId: s.teamAId,
    teamBId: s.teamBId,
    winsToWin: s.winsToWin,
    winnerTeamId: s.winnerTeamId,
    winnerDeterminedManually: s.winnerDeterminedManually,
    matches: s.matches,
  });
  return {
    id: s.id,
    label: s.label,
    bracketColumn: s.bracketColumn ?? 0,
    bracketRow: s.bracketRow ?? 0,
    teamAId: s.teamAId,
    teamBId: s.teamBId,
    teamAName: s.teamA.name,
    teamBName: s.teamB.name,
    winsToWin: s.winsToWin,
    winsA: score.winsA,
    winsB: score.winsB,
    winnerTeamId: score.winnerTeamId,
  };
}
