import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PlayoffBracket } from "@/components/public/playoff-bracket";
import { mapSeriesToBracketItem } from "@/lib/playoff-bracket-display";
import { updatePlayoffSeriesBracket } from "@/actions/playoff-bracket";
import {
  resyncPlayoffSeriesWinnerFromMatches,
  setPlayoffSeriesManualResult,
} from "@/actions/playoff-series-admin";
import { loadPlayoffSeriesRowsForTournament } from "@/lib/playoff-bracket-queries";

export default async function AdminTournamentDetailPage({
  params,
}: {
  params: Promise<{ leagueSlug: string; tournamentId: string }>;
}) {
  const { leagueSlug, tournamentId } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, leagueId: league.id },
    include: {
      standings: {
        include: { team: { select: { name: true, logo: true } } },
        orderBy: [{ points: "desc" }, { goalsFor: "desc" }],
      },
    },
  });

  if (!tournament) notFound();

  const playoffSeriesList = await loadPlayoffSeriesRowsForTournament(tournament.id);

  const playoffBracketItems = playoffSeriesList.map(mapSeriesToBracketItem);

  const PLAYOFF_PAIRING_LABELS: Record<string, string> = {
    SEEDING_1_8: "По посеву (1 vs 8, 2 vs 7, …)",
    SEEDING_ADJACENT: "Соседние места (1–2, 3–4, …)",
    MANUAL: "Вручную",
  };

  const events = await prisma.matchEvent.findMany({
    where: {
      match: {
        tournamentId: tournament.id,
        leagueId: league.id,
        archivedAt: null,
      },
    },
    include: {
      player: { select: { id: true, firstName: true, lastName: true } },
      team: { select: { name: true } },
    },
  });

  type Row = {
    playerId: string;
    label: string;
    teamName: string;
    goals: number;
    assists: number;
  };
  const byPlayer = new Map<string, Row>();
  for (const ev of events) {
    if (ev.type !== "GOAL" && ev.type !== "ASSIST") continue;
    const label = `${ev.player.lastName} ${ev.player.firstName}`;
    let row = byPlayer.get(ev.playerId);
    if (!row) {
      row = {
        playerId: ev.playerId,
        label,
        teamName: ev.team.name,
        goals: 0,
        assists: 0,
      };
      byPlayer.set(ev.playerId, row);
    }
    if (ev.type === "GOAL") row.goals += 1;
    if (ev.type === "ASSIST") row.assists += 1;
  }
  const statRows = [...byPlayer.values()].sort((a, b) => b.goals - a.goals || b.assists - a.assists);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/tournaments"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Все турниры
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {tournament.emblem ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tournament.emblem}
              alt=""
              className="h-16 w-16 shrink-0 rounded-lg border border-gray-200 bg-white object-contain p-1"
            />
          ) : null}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {tournament.archivedAt ? (
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Архив</span>
              ) : (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Активный</span>
              )}
            </p>
            {tournament.type === "PLAYOFF" && (
              <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50/80 px-3 py-2 text-sm text-violet-950">
                <p>
                  <span className="font-medium">Плей-офф:</span>{" "}
                  {tournament.playoffPairing
                    ? PLAYOFF_PAIRING_LABELS[tournament.playoffPairing] ?? tournament.playoffPairing
                    : "—"}
                  {tournament.seriesWinsToWin != null ? (
                    <>
                      {" "}
                      · до {tournament.seriesWinsToWin}{" "}
                      {tournament.seriesWinsToWin === 1
                        ? "победы в серии"
                        : "побед в серии"}
                    </>
                  ) : null}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {tournament.type === "PLAYOFF" && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Плей-офф: сетка и итоги серий</h2>
          <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2.5 text-sm text-violet-950 space-y-1">
            <p>
              <span className="font-medium">Позиция на сетке:</span> колонка{" "}
              <span className="font-mono">0</span> — первый раунд (слева), дальше номер растёт к финалу.
              «Позиция сверху вниз» задаёт порядок пар в одной колонке.
            </p>
            <p>
              <span className="font-medium">Итог серии:</span> можно{" "}
              <span className="font-medium">занести вручную</span> (победитель фиксируется и не
              пересчитывается при правках матчей) или при необходимости снова выставить победителя{" "}
              <span className="font-medium">по завершённым матчам</span> в протоколе.
            </p>
          </div>
          {playoffBracketItems.length > 0 ? (
            <>
              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
                <PlayoffBracket series={playoffBracketItems} />
              </div>
              <ul className="mt-4 space-y-4 text-sm">
                {playoffSeriesList.map((s) => {
                  const selectOutcome =
                    s.winnerTeamId === s.teamA.id
                      ? "teamA"
                      : s.winnerTeamId === s.teamB.id
                        ? "teamB"
                        : "clear";
                  return (
                  <li
                    key={s.id}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-4 space-y-4"
                  >
                    <div className="text-gray-900">
                      {s.label ? (
                        <span className="mr-2 text-violet-800 font-medium">{s.label}</span>
                      ) : null}
                      <span className="font-semibold">{s.teamA.name}</span>
                      {" — "}
                      <span className="font-semibold">{s.teamB.name}</span>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-slate-50/80 p-3 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Итог серии
                      </p>
                      {s.winnerDeterminedManually ? (
                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
                          Победитель зафиксирован вручную — при сохранении матчей итог не
                          пересчитывается автоматически.
                        </p>
                      ) : null}
                      <form
                        action={setPlayoffSeriesManualResult}
                        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
                      >
                        <input type="hidden" name="seriesId" value={s.id} />
                        <label className="flex flex-col gap-1 text-xs text-gray-600 min-w-[220px]">
                          Победитель серии
                          <select
                            name="outcome"
                            defaultValue={selectOutcome}
                            className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
                          >
                            <option value="clear">Не завершена / сбросить и пересчитать по матчам</option>
                            <option value="teamA">{s.teamA.name}</option>
                            <option value="teamB">{s.teamB.name}</option>
                          </select>
                        </label>
                        <button
                          type="submit"
                          className="rounded-md bg-slate-800 px-3 py-2 text-xs font-medium text-white hover:bg-slate-900"
                        >
                          Сохранить итог
                        </button>
                      </form>
                      <form action={resyncPlayoffSeriesWinnerFromMatches}>
                        <input type="hidden" name="seriesId" value={s.id} />
                        <button
                          type="submit"
                          className="text-xs text-violet-700 underline underline-offset-2 hover:text-violet-900"
                        >
                          Только пересчитать по матчам (снять ручную фиксацию)
                        </button>
                      </form>
                    </div>

                    <div className="rounded-md border border-violet-100 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-900 mb-2">
                        Позиция пары на сетке (портал)
                      </p>
                      <form
                        action={updatePlayoffSeriesBracket}
                        className="flex flex-wrap items-end gap-2"
                      >
                        <input type="hidden" name="seriesId" value={s.id} />
                        <label className="flex flex-col gap-0.5 text-xs text-gray-500">
                          Колонка (раунд)
                          <input
                            type="number"
                            name="bracketColumn"
                            min={0}
                            max={32}
                            defaultValue={s.bracketColumn ?? 0}
                            className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                          />
                        </label>
                        <label className="flex flex-col gap-0.5 text-xs text-gray-500">
                          Сверху вниз
                          <input
                            type="number"
                            name="bracketRow"
                            min={0}
                            max={127}
                            defaultValue={s.bracketRow ?? 0}
                            className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                          />
                        </label>
                        <button
                          type="submit"
                          className="rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700"
                        >
                          Сохранить позицию
                        </button>
                      </form>
                    </div>
                  </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              Серии плей-офф ещё не созданы — добавьте пару в разделе «Матчи».
            </p>
          )}
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">Турнирная таблица</h2>
        <p className="text-sm text-gray-500 mt-1">
          {tournament.type === "PLAYOFF"
            ? "Для плей-офф на портале отображается сетка; таблица по матчам группового этапа здесь не используется."
            : "Обновляется при сохранении результатов матчей этого турнира."}
        </p>
        {tournament.type === "PLAYOFF" ? (
          <p className="mt-4 text-sm text-gray-400">
            Переключитесь на блок «Сетка плей-офф» выше.
          </p>
        ) : (
        <div className="mt-4 rounded-xl border bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-8">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Команда</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">И</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">В</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">Н</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">П</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">ЗШ</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">ПШ</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">Р</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500 font-bold">О</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tournament.standings.map((row, i) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-medium">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.team.name}</td>
                  <td className="text-center px-3 py-3 text-gray-500">{row.gamesPlayed}</td>
                  <td className="text-center px-3 py-3 text-gray-500">{row.wins}</td>
                  <td className="text-center px-3 py-3 text-gray-500">{row.draws}</td>
                  <td className="text-center px-3 py-3 text-gray-500">{row.losses}</td>
                  <td className="text-center px-3 py-3 text-gray-500">{row.goalsFor}</td>
                  <td className="text-center px-3 py-3 text-gray-500">{row.goalsAgainst}</td>
                  <td className="text-center px-3 py-3 text-gray-500">
                    {row.goalsFor - row.goalsAgainst > 0 ? "+" : ""}
                    {row.goalsFor - row.goalsAgainst}
                  </td>
                  <td className="text-center px-3 py-3 font-bold text-gray-900">{row.points}</td>
                </tr>
              ))}
              {tournament.standings.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                    Пока нет строк таблицы. Добавьте матчи и зафиксируйте результаты — таблица заполнится автоматически.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">Статистика игроков</h2>
        <p className="text-sm text-gray-500 mt-1">
          Голы и передачи по протоколам матчей турнира.
        </p>
        <div className="mt-4 rounded-xl border bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Игрок</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Команда</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Голы</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Передачи</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {statRows.map((row, i) => (
                <tr key={row.playerId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.label}</td>
                  <td className="px-4 py-3 text-gray-500">{row.teamName}</td>
                  <td className="text-center px-4 py-3 font-medium text-gray-900">{row.goals}</td>
                  <td className="text-center px-4 py-3 text-gray-500">{row.assists}</td>
                </tr>
              ))}
              {statRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Нет событий в протоколах. После внесения голов и передач статистика появится здесь.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
