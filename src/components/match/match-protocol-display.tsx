import type { MatchEventType, MatchStatus, SportType } from "@prisma/client";
import Link from "next/link";
import { getEventTypeLabel, getSportConfig, type SportConfig } from "@/lib/sport-config";
import { formatDateTime } from "@/lib/utils";
import {
  MatchEventMarker,
  PenaltyRowIcon,
  SportGoalMarker,
} from "@/components/match/protocol-icons";

type PlayerMini = {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
};

export type ProtocolEventRow = {
  id: string;
  type: string;
  period: number;
  time: string;
  teamId: string;
  player: PlayerMini;
};

export type ProtocolPenaltyRow = {
  id: string;
  minutes: number;
  reason: string;
  period: number;
  time: string;
  teamId: string;
  player: PlayerMini;
};

export type ProtocolGoalieRow = {
  player: PlayerMini;
  teamId: string;
  saves: number;
  goalsAgainst: number;
  shutout: boolean;
};

function compareProtocolOrder(
  a: { period: number; time: string },
  b: { period: number; time: string }
): number {
  if (a.period !== b.period) return a.period - b.period;
  const [am, as] = a.time.split(":").map((x) => Number(x) || 0);
  const [bm, bs] = b.time.split(":").map((x) => Number(x) || 0);
  return am * 60 + as - (bm * 60 + bs);
}

function formatPlayerName(p: PlayerMini) {
  const mid = p.middleName ? `${p.middleName.charAt(0)}. ` : "";
  return `${p.lastName} ${mid}${p.firstName}`;
}

function formatAssistLine(p: PlayerMini) {
  return `${p.lastName} ${p.firstName}`;
}

function PlayerNameLink({ player }: { player: PlayerMini }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
    >
      {formatPlayerName(player)}
    </Link>
  );
}

function PlayerAssistLink({ player }: { player: PlayerMini }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="text-blue-600 hover:text-blue-800 hover:underline"
    >
      {formatAssistLine(player)}
    </Link>
  );
}

function periodHeading(sportType: SportType, period: number, cfg: SportConfig): string {
  const t = cfg.terminology.period.toLowerCase();
  if (sportType === "HOCKEY") {
    if (period <= cfg.terminology.periods) return `${period}-й период`;
    return period === 4 ? "Овертайм" : `${period}-й период`;
  }
  if (sportType === "FOOTBALL") {
    if (period <= 2) return `${period}-й тайм`;
    return `Дополнительное время (${period})`;
  }
  if (sportType === "BASKETBALL") {
    if (period <= 4) return `${period}-я четверть`;
    return `Овертайм (${period})`;
  }
  if (sportType === "VOLLEYBALL") {
    return `${period}-й сет`;
  }
  return `${period}-й ${t}`;
}

type GoalGroup = {
  kind: "goal";
  goal: ProtocolEventRow;
  assists: ProtocolEventRow[];
};

type SingleEv = { kind: "single"; event: ProtocolEventRow };

type TimelineEntry = GoalGroup | SingleEv;

function buildTimeline(events: ProtocolEventRow[]): TimelineEntry[] {
  const sorted = [...events].sort(compareProtocolOrder);
  const assistUsed = new Set<string>();
  const out: TimelineEntry[] = [];

  for (const e of sorted) {
    if (e.type === "ASSIST" && assistUsed.has(e.id)) continue;

    if (e.type === "GOAL") {
      const assists = sorted.filter(
        (a) =>
          a.type === "ASSIST" &&
          a.teamId === e.teamId &&
          a.period === e.period &&
          a.time === e.time &&
          !assistUsed.has(a.id)
      );
      assists.forEach((a) => assistUsed.add(a.id));
      out.push({ kind: "goal", goal: e, assists });
    } else if (e.type === "ASSIST") {
      out.push({ kind: "single", event: e });
    } else {
      out.push({ kind: "single", event: e });
    }
  }
  return out;
}

function entriesByPeriod(entries: TimelineEntry[]): Map<number, TimelineEntry[]> {
  const m = new Map<number, TimelineEntry[]>();
  for (const entry of entries) {
    const period =
      entry.kind === "goal" ? entry.goal.period : entry.event.period;
    if (!m.has(period)) m.set(period, []);
    m.get(period)!.push(entry);
  }
  const sortedPeriods = [...m.keys()].sort((a, b) => a - b);
  const ordered = new Map<number, TimelineEntry[]>();
  for (const p of sortedPeriods) {
    const list = m.get(p)!;
    list.sort((a, b) => {
      const ta = a.kind === "goal" ? a.goal : a.event;
      const tb = b.kind === "goal" ? b.goal : b.event;
      return compareProtocolOrder(ta, tb);
    });
    ordered.set(p, list);
  }
  return ordered;
}

function splitByTeam(
  entries: TimelineEntry[],
  homeTeamId: string
): { home: TimelineEntry[]; away: TimelineEntry[] } {
  const home: TimelineEntry[] = [];
  const away: TimelineEntry[] = [];
  for (const entry of entries) {
    const tid = entry.kind === "goal" ? entry.goal.teamId : entry.event.teamId;
    if (tid === homeTeamId) home.push(entry);
    else away.push(entry);
  }
  return { home, away };
}

function TimelineEntryCard({
  entry,
  sportType,
  homeTeamId,
  cfg,
}: {
  entry: TimelineEntry;
  sportType: SportType;
  homeTeamId: string;
  cfg: SportConfig;
}) {
  if (entry.kind === "goal") {
    const { goal, assists } = entry;
    const isHome = goal.teamId === homeTeamId;
    return (
      <div
        className={`rounded-lg border px-3 py-2.5 shadow-sm ${
          isHome
            ? "border-blue-200/80 bg-gradient-to-r from-blue-50/90 to-white"
            : "border-violet-200/80 bg-gradient-to-l from-violet-50/90 to-white"
        }`}
      >
        <div className="flex gap-2.5 items-start">
          <SportGoalMarker sportType={sportType} className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-xs font-medium text-gray-500 tabular-nums">{goal.time}</span>
              <span className="text-sm font-semibold text-gray-900 leading-snug">
                <PlayerNameLink player={goal.player} />
              </span>
            </div>
            {assists.length > 0 && (
              <div className="mt-1.5 pl-0 border-l-2 border-gray-200 ml-1 space-y-0.5">
                {assists.map((a) => (
                  <p key={a.id} className="text-xs text-gray-500 pl-2">
                    <span className="text-gray-400">{cfg.terminology.assist}: </span>
                    <PlayerAssistLink player={a.player} />
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const e = entry.event;
  const isHome = e.teamId === homeTeamId;
  const label = getEventTypeLabel(sportType, e.type as MatchEventType);
  const et = e.type as MatchEventType;
  const hideMarker = et === "ASSIST";

  return (
    <div
      className={`rounded-lg border px-3 py-2 shadow-sm flex gap-2.5 items-start ${
        isHome
          ? "border-blue-200/70 bg-blue-50/40"
          : "border-violet-200/70 bg-violet-50/40"
      }`}
    >
      {!hideMarker ? (
        <span className="shrink-0 mt-0.5">
          <MatchEventMarker sportType={sportType} type={et} />
        </span>
      ) : (
        <span className="w-5 shrink-0" aria-hidden />
      )}
      <div className="min-w-0 flex-1 text-sm">
        <span className="text-xs text-gray-500 tabular-nums mr-2">{e.time}</span>
        <span className="font-medium text-gray-800">{label}</span>
        <span className="text-gray-600">
          {" "}
          — <PlayerNameLink player={e.player} />
        </span>
      </div>
    </div>
  );
}

function TeamColumn({
  title,
  accent,
  entries,
  sportType,
  homeTeamId,
  cfg,
  emptyHint,
}: {
  title: string;
  accent: "home" | "away";
  entries: TimelineEntry[];
  sportType: SportType;
  homeTeamId: string;
  cfg: SportConfig;
  emptyHint: string;
}) {
  const bar =
    accent === "home"
      ? "border-l-4 border-blue-500 bg-blue-50/25"
      : "border-r-4 border-violet-500 bg-violet-50/25";

  return (
    <div className={`rounded-xl ${bar} p-4 min-h-[120px]`}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3 truncate">
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-2">{emptyHint}</p>
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry) => (
            <TimelineEntryCard
              key={entry.kind === "goal" ? entry.goal.id : entry.event.id}
              entry={entry}
              sportType={sportType}
              homeTeamId={homeTeamId}
              cfg={cfg}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PenaltyCard({
  p,
  sportType,
  homeTeamId,
  homeTeamName,
  awayTeamName,
}: {
  p: ProtocolPenaltyRow;
  sportType: SportType;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
}) {
  const isHome = p.teamId === homeTeamId;
  const side = isHome ? homeTeamName : awayTeamName;
  return (
    <div
      className={`rounded-lg border px-3 py-2 flex gap-2.5 items-start text-sm ${
        isHome ? "border-blue-200/70 bg-blue-50/35" : "border-violet-200/70 bg-violet-50/35"
      }`}
    >
      <PenaltyRowIcon sportType={sportType} />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-gray-500 tabular-nums mb-0.5">
          {p.period} п. · {p.time}
        </div>
        <div className="font-medium text-gray-900">
          {p.minutes} мин · {p.reason}
        </div>
        <div className="text-gray-600 text-xs mt-0.5">
          <PlayerNameLink player={p.player} /> · {side}
        </div>
      </div>
    </div>
  );
}

export function MatchProtocolDisplay({
  sportType,
  status,
  datetime,
  venue,
  tournamentName,
  homeTeamId,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  overtime,
  shootout,
  events,
  penalties,
  goalieStats,
  referees,
}: {
  sportType: SportType;
  status: MatchStatus;
  datetime: Date;
  venue: string | null;
  tournamentName: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  overtime: boolean;
  shootout: boolean;
  events: ProtocolEventRow[];
  penalties: ProtocolPenaltyRow[];
  goalieStats: ProtocolGoalieRow[];
  /** Судьи матча (после сохранения протокола) */
  referees?: { firstName: string; lastName: string; role: string | null }[];
}) {
  const cfg = getSportConfig(sportType);
  const timeline = buildTimeline(events);
  const byPeriod = entriesByPeriod(timeline);

  const penaltiesSorted = [...penalties].sort(compareProtocolOrder);
  const penaltiesByPeriod = new Map<number, ProtocolPenaltyRow[]>();
  for (const p of penaltiesSorted) {
    if (!penaltiesByPeriod.has(p.period)) penaltiesByPeriod.set(p.period, []);
    penaltiesByPeriod.get(p.period)!.push(p);
  }
  const penaltyPeriods = [...penaltiesByPeriod.keys()].sort((a, b) => a - b);

  const statusNote =
    status === "CANCELLED"
      ? "Матч отменён."
      : status === "POSTPONED"
        ? "Матч перенесён."
        : status === "SCHEDULED" || status === "LIVE"
          ? "Протокол событий будет доступен после завершения матча."
          : null;

  return (
    <div className="space-y-8">
      <div className="surface-match p-6">
        <p className="text-sm text-gray-500">{formatDateTime(datetime)}</p>
        {venue && <p className="text-sm text-gray-500 mt-1">{venue}</p>}
        <p className="text-sm text-gray-600 mt-1">{tournamentName}</p>

        {referees && referees.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium text-gray-800 mb-1">Судьи</p>
            <ul className="space-y-0.5">
              {referees.map((r, i) => (
                <li key={i}>
                  {r.lastName} {r.firstName}
                  {r.role ? ` — ${r.role}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-8">
          <span className="text-lg font-semibold text-gray-900 text-center sm:text-right sm:flex-1">
            {homeTeamName}
          </span>
          {status === "FINISHED" && homeScore !== null && awayScore !== null ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl font-bold text-gray-900 tabular-nums">
                {homeScore} : {awayScore}
              </span>
              {(overtime || shootout) && (
                <span className="text-xs font-medium text-blue-600">
                  {shootout ? "Буллиты / серия буллитов" : "Овертайм"}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xl font-medium text-gray-400 text-center px-4">—</span>
          )}
          <span className="text-lg font-semibold text-gray-900 text-center sm:text-left sm:flex-1">
            {awayTeamName}
          </span>
        </div>

        {statusNote && (
          <p className="mt-6 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
            {statusNote}
          </p>
        )}
      </div>

      {status === "FINISHED" && timeline.length > 0 && (
        <section className="surface-match p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Ход матча · {cfg.terminology.period}
          </h2>
          <div className="space-y-10">
            {[...byPeriod.entries()].map(([period, periodEntries]) => {
              const { home, away } = splitByTeam(periodEntries, homeTeamId);
              return (
                <div key={period} className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider px-4 py-1.5 rounded-full bg-gray-100 border border-gray-200/80 shadow-sm whitespace-nowrap">
                      {periodHeading(sportType, period, cfg)}
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <TeamColumn
                      title={`${homeTeamName} · хозяева`}
                      accent="home"
                      entries={home}
                      sportType={sportType}
                      homeTeamId={homeTeamId}
                      cfg={cfg}
                      emptyHint="Нет событий в этом периоде"
                    />
                    <TeamColumn
                      title={`${awayTeamName} · гости`}
                      accent="away"
                      entries={away}
                      sportType={sportType}
                      homeTeamId={homeTeamId}
                      cfg={cfg}
                      emptyHint="Нет событий в этом периоде"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {status === "FINISHED" && penaltiesSorted.length > 0 && (
        <section className="surface-match p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Удаления и штрафы
          </h2>
          <div className="space-y-8">
            {penaltyPeriods.map((period) => {
              const list = penaltiesByPeriod.get(period)!;
              const homeP = list.filter((x) => x.teamId === homeTeamId);
              const awayP = list.filter((x) => x.teamId !== homeTeamId);
              return (
                <div key={period}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
                    <span className="text-xs font-bold uppercase tracking-wide text-amber-900/80 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                      {periodHeading(sportType, period, cfg)}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 rounded-xl border-l-4 border-blue-500 bg-blue-50/20 p-3">
                      <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">
                        {homeTeamName}
                      </p>
                      {homeP.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">—</p>
                      ) : (
                        homeP.map((p) => (
                          <PenaltyCard
                            key={p.id}
                            p={p}
                            sportType={sportType}
                            homeTeamId={homeTeamId}
                            homeTeamName={homeTeamName}
                            awayTeamName={awayTeamName}
                          />
                        ))
                      )}
                    </div>
                    <div className="space-y-2 rounded-xl border-r-4 border-violet-500 bg-violet-50/20 p-3">
                      <p className="text-[10px] font-bold uppercase text-gray-500 mb-2 text-right">
                        {awayTeamName}
                      </p>
                      {awayP.length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-right">—</p>
                      ) : (
                        awayP.map((p) => (
                          <PenaltyCard
                            key={p.id}
                            p={p}
                            sportType={sportType}
                            homeTeamId={homeTeamId}
                            homeTeamName={homeTeamName}
                            awayTeamName={awayTeamName}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {status === "FINISHED" && goalieStats.length > 0 && (
        <section className="surface-match p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Вратари</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-gray-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Игрок</th>
                  <th className="py-2 pr-4 font-medium">Команда</th>
                  <th className="py-2 pr-4 font-medium text-center">Сэйвы</th>
                  <th className="py-2 pr-4 font-medium text-center">Пропущено</th>
                  <th className="py-2 font-medium text-center">Сухой</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {goalieStats.map((g, i) => (
                  <tr key={`${g.teamId}-${i}`}>
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      <PlayerNameLink player={g.player} />
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {g.teamId === homeTeamId ? homeTeamName : awayTeamName}
                    </td>
                    <td className="py-2 pr-4 text-center tabular-nums">{g.saves}</td>
                    <td className="py-2 pr-4 text-center tabular-nums">{g.goalsAgainst}</td>
                    <td className="py-2 text-center">{g.shutout ? "Да" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {status === "FINISHED" && events.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          События в протокол не занесены.
        </p>
      )}
    </div>
  );
}
