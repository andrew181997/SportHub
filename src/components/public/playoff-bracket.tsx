import type { PlayoffSeriesForBracket } from "@/lib/playoff-bracket-display";
import { getPlayoffColumnLabel } from "@/lib/playoff-bracket-display";

type Props = {
  series: PlayoffSeriesForBracket[];
  className?: string;
};

function groupByColumn(items: PlayoffSeriesForBracket[]) {
  const maxCol = items.length ? Math.max(...items.map((s) => s.bracketColumn), 0) : 0;
  const byCol = new Map<number, PlayoffSeriesForBracket[]>();
  for (const s of items) {
    const list = byCol.get(s.bracketColumn) ?? [];
    list.push(s);
    byCol.set(s.bracketColumn, list);
  }
  for (const [, list] of byCol) {
    list.sort((a, b) => a.bracketRow - b.bracketRow);
  }
  const sortedColumns = [...byCol.keys()].sort((a, b) => a - b);
  return { maxCol, byCol, sortedColumns };
}

/** Публичная сетка плей-офф: колонки по `bracketColumn`, порядок в колонке по `bracketRow`. */
export function PlayoffBracket({ series, className = "" }: Props) {
  if (series.length === 0) return null;
  const { maxCol, byCol, sortedColumns } = groupByColumn(series);

  return (
    <div
      className={`flex gap-6 overflow-x-auto pb-2 ${className}`.trim()}
      aria-label="Сетка плей-офф"
    >
      {sortedColumns.map((col) => {
        const colSeries = byCol.get(col) ?? [];
        const title = getPlayoffColumnLabel(col, maxCol);
        return (
          <div
            key={col}
            className="flex min-w-[220px] max-w-[280px] flex-1 flex-col gap-3"
          >
            <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              {title}
            </h3>
            <div className="flex flex-col gap-3">
              {colSeries.map((s) => (
                <article
                  key={s.id}
                  className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  {s.label ? (
                    <p className="mb-2 text-xs font-medium text-violet-800">{s.label}</p>
                  ) : null}
                  <div className="space-y-2 text-sm">
                    <div
                      className={
                        s.winnerTeamId === s.teamAId
                          ? "font-semibold text-slate-900"
                          : "text-slate-800"
                      }
                    >
                      {s.teamAName}
                    </div>
                    <div
                      className={
                        s.winnerTeamId === s.teamBId
                          ? "font-semibold text-slate-900"
                          : "text-slate-800"
                      }
                    >
                      {s.teamBName}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-600">
                    <span>
                      Счёт серии:{" "}
                      <span className="font-mono font-semibold text-slate-900">
                        {s.winsA} : {s.winsB}
                      </span>
                    </span>
                    <span className="text-slate-400">до {s.winsToWin}</span>
                  </div>
                  {s.winnerTeamId ? (
                    <p className="mt-2 text-xs font-medium text-emerald-700">
                      Победитель:{" "}
                      {s.winnerTeamId === s.teamAId ? s.teamAName : s.teamBName}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">Серия идёт</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
