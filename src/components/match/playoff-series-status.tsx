type Props = {
  teamAName: string;
  teamBName: string;
  winsA: number;
  winsB: number;
  winsToWin: number;
  winnerName: string | null;
};

export function PlayoffSeriesStatus({
  teamAName,
  teamBName,
  winsA,
  winsB,
  winsToWin,
  winnerName,
}: Props) {
  const maxGames = winsToWin * 2 - 1;
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950">
      <p className="font-semibold text-violet-900">Серия плей-офф</p>
      <p className="mt-2 text-lg font-bold tabular-nums">
        {teamAName}{" "}
        <span className="text-violet-700">
          {winsA} : {winsB}
        </span>{" "}
        {teamBName}
      </p>
      <p className="mt-1 text-xs text-violet-800">
        До {winsToWin} побед в серии (максимум {maxGames}{" "}
        {pluralGames(maxGames)})
      </p>
      {winnerName ? (
        <p className="mt-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-900">
          Победитель серии: {winnerName}
        </p>
      ) : null}
    </div>
  );
}

function pluralGames(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "игра";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "игры";
  return "игр";
}
