import Link from "next/link";
import {
  STAT_SORT_OPTIONS,
  type LeagueStatRow,
  type StatSortBy,
} from "@/lib/league-stats";

function headCellClass(active: boolean) {
  return active ? "league-stat-th-active" : "league-stat-th-muted";
}

function cellClass(active: boolean) {
  return active ? "league-stat-cell-active" : "league-stat-cell-muted";
}

export function LeagueStatisticsFilters({
  sortBy,
  tournamentId,
  tournaments,
}: {
  sortBy: StatSortBy;
  tournamentId: string | undefined;
  tournaments: Array<{ id: string; name: string }>;
}) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-4 mb-6">
      <div>
        <label htmlFor="stat-by" className="league-form-label">
          Критерий сортировки
        </label>
        <select
          id="stat-by"
          name="by"
          defaultValue={sortBy}
          className="league-form-select min-w-[220px]"
        >
          {STAT_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="stat-tournament" className="league-form-label">
          Турнир
        </label>
        <select
          id="stat-tournament"
          name="tournament"
          defaultValue={tournamentId ?? "all"}
          className="league-form-select min-w-[200px]"
        >
          <option value="all">Все турниры</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="league-form-submit">
        Показать
      </button>
    </form>
  );
}

export function LeagueStatisticsTable({
  rows,
  sortBy,
  rowOffset = 0,
}: {
  rows: LeagueStatRow[];
  sortBy: StatSortBy;
  /** Смещение нумерации при пагинации */
  rowOffset?: number;
}) {
  return (
    <div className="surface-table-wrap overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-600 w-10">#</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Игрок</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Команда</th>
            <th className={headCellClass(sortBy === "goals")}>Г</th>
            <th className={headCellClass(sortBy === "assists")}>П</th>
            <th className={headCellClass(sortBy === "points")}>Очк</th>
            <th className={headCellClass(sortBy === "penalty_minutes")}>Штр</th>
            <th className={headCellClass(sortBy === "saves")}>Сэйвы</th>
            <th className={headCellClass(sortBy === "goals_against")}>Проп</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row, i) => (
            <tr key={row.playerId} className="surface-player-row">
              <td className="px-4 py-3 text-slate-600 tabular-nums">{rowOffset + i + 1}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/players/${row.playerId}`}
                  className="font-medium hover:underline league-stat-player-link"
                >
                  {row.lastName} {row.firstName}
                  {row.middleName ? ` ${row.middleName}` : ""}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600">{row.teamName ?? "—"}</td>
              <td className={cellClass(sortBy === "goals")}>{row.goals}</td>
              <td className={cellClass(sortBy === "assists")}>{row.assists}</td>
              <td className={cellClass(sortBy === "points")}>{row.points}</td>
              <td className={cellClass(sortBy === "penalty_minutes")}>{row.penaltyMinutes}</td>
              <td className={cellClass(sortBy === "saves")}>{row.saves}</td>
              <td className={cellClass(sortBy === "goals_against")}>{row.goalsAgainst}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                Нет данных по завершённым матчам за выбранный период
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
