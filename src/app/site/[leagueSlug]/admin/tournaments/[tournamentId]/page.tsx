import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

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

  const playoffSeriesList = await prisma.playoffSeries.findMany({
    where: { tournamentId: tournament.id },
    orderBy: { createdAt: "asc" },
    include: {
      teamA: { select: { id: true, name: true } },
      teamB: { select: { id: true, name: true } },
    },
  });

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

      {tournament.type === "PLAYOFF" && playoffSeriesList.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Серии плей-офф</h2>
          <p className="text-sm text-gray-500 mt-1">
            Матчи серии создаются в разделе «Матчи» (новая серия или продолжение существующей).
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {playoffSeriesList.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  {s.label ? `${s.label} · ` : ""}
                  <span className="font-medium">{s.teamA.name}</span>
                  {" — "}
                  <span className="font-medium">{s.teamB.name}</span>
                </span>
                {s.winnerTeamId ? (
                  <span className="text-xs font-medium text-emerald-700">
                    Победитель серии:{" "}
                    {s.winnerTeamId === s.teamA.id ? s.teamA.name : s.teamB.name}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">Серия не завершена</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">Турнирная таблица</h2>
        <p className="text-sm text-gray-500 mt-1">
          Обновляется при сохранении результатов матчей этого турнира.
        </p>
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
