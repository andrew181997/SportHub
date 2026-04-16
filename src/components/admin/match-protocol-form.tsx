"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { replaceMatchProtocol } from "@/actions/matches";
import {
  applyMmSsMask,
  normalizeTimeForMask,
  PROTOCOL_TIME_MMSS_RE,
} from "@/lib/match-time-mask";
import type { SportConfig } from "@/lib/sport-config";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface ProtocolEvent {
  type: string;
  playerId: string;
  teamId: string;
  /** Пустая строка пока пользователь стирает число в инпуте */
  period: number | "";
  time: string;
}

interface PenaltyEntry {
  playerId: string;
  teamId: string;
  minutes: number | "";
  reason: string;
  period: number | "";
  time: string;
}

export interface MatchProtocolInitial {
  homeScore: number;
  awayScore: number;
  overtime: boolean;
  shootout: boolean;
  events: ProtocolEvent[];
  penalties: PenaltyEntry[];
  /** Сохранённые сэйвы и «сухой» по id вратаря */
  goalieStats: { playerId: string; saves: number; shutout: boolean }[];
  /** Судьи матча (из справочника лиги) */
  referees?: { refereeId: string; role?: string | null }[];
}

interface LeagueRefereeOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface ProtocolRefereeRow {
  refereeId: string;
  role: string;
}

interface Props {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: Player[];
  awayPlayers: Player[];
  sportConfig: SportConfig;
  initialProtocol?: MatchProtocolInitial | null;
  /** Матч уже в статусе «завершён» — подписи кнопки и сообщения как при правке. */
  hasFinishedResult?: boolean;
  /** Судьи лиги для протокола */
  leagueReferees?: LeagueRefereeOption[];
}

export function MatchProtocolForm({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homePlayers,
  awayPlayers,
  sportConfig,
  initialProtocol,
  hasFinishedResult = false,
  leagueReferees = [],
}: Props) {
  const router = useRouter();
  const [homeScoreStr, setHomeScoreStr] = useState(() =>
    String(initialProtocol?.homeScore ?? 0)
  );
  const [awayScoreStr, setAwayScoreStr] = useState(() =>
    String(initialProtocol?.awayScore ?? 0)
  );
  const [overtime, setOvertime] = useState(initialProtocol?.overtime ?? false);
  const [shootout, setShootout] = useState(initialProtocol?.shootout ?? false);
  const [events, setEvents] = useState<ProtocolEvent[]>(() =>
    (initialProtocol?.events ?? []).map((e) => ({
      ...e,
      time: normalizeTimeForMask(e.time),
    }))
  );
  const [penalties, setPenalties] = useState<PenaltyEntry[]>(() =>
    (initialProtocol?.penalties ?? []).map((p) => ({
      ...p,
      time: normalizeTimeForMask(p.time),
    }))
  );
  const [goalieFields, setGoalieFields] = useState<
    Record<string, { savesStr: string; shutout: boolean }>
  >(() => {
    const m: Record<string, { savesStr: string; shutout: boolean }> = {};
    for (const g of initialProtocol?.goalieStats ?? []) {
      m[g.playerId] = { savesStr: String(g.saves), shutout: g.shutout };
    }
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [protocolReferees, setProtocolReferees] = useState<ProtocolRefereeRow[]>(() =>
    (initialProtocol?.referees ?? []).map((r) => ({
      refereeId: r.refereeId,
      role: r.role?.trim() ?? "",
    }))
  );

  const addProtocolReferee = () => {
    setProtocolReferees([
      ...protocolReferees,
      { refereeId: leagueReferees[0]?.id ?? "", role: "" },
    ]);
  };

  const removeProtocolReferee = (index: number) => {
    setProtocolReferees(protocolReferees.filter((_, i) => i !== index));
  };

  const updateProtocolReferee = (
    index: number,
    field: keyof ProtocolRefereeRow,
    value: string
  ) => {
    const next = [...protocolReferees];
    const row = { ...next[index]! };
    row[field] = value;
    next[index] = row;
    setProtocolReferees(next);
  };

  const addEvent = () => {
    setEvents([
      ...events,
      {
        type: sportConfig.eventTypes[0]?.value ?? "GOAL",
        playerId: "",
        teamId: homeTeamId,
        period: 1,
        time: "",
      },
    ]);
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const updateEvent = (index: number, field: keyof ProtocolEvent, value: string | number) => {
    const updated = [...events];
    const row = { ...updated[index]! };
    (row as Record<string, string | number>)[field] = value;
    updated[index] = row;
    setEvents(updated);
  };

  const addPenaltyEntry = () => {
    setPenalties([
      ...penalties,
      {
        playerId: "",
        teamId: homeTeamId,
        minutes: 2,
        reason: "",
        period: 1,
        time: "",
      },
    ]);
  };

  const removePenalty = (index: number) => {
    setPenalties(penalties.filter((_, i) => i !== index));
  };

  const updatePenaltyEntry = (
    index: number,
    field: keyof PenaltyEntry,
    value: string | number
  ) => {
    const updated = [...penalties];
    const row = { ...updated[index]! };
    (row as Record<string, string | number>)[field] = value;
    updated[index] = row;
    setPenalties(updated);
  };

  const getPlayersForTeam = (teamId: string) =>
    teamId === homeTeamId ? homePlayers : awayPlayers;

  const goalies = [...homePlayers, ...awayPlayers].filter((p) => p.role === "GOALIE");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const homeTrim = homeScoreStr.trim();
    const awayTrim = awayScoreStr.trim();
    if (homeTrim === "" || awayTrim === "") {
      setMessage("Ошибка: укажите счёт обеих команд.");
      setSaving(false);
      return;
    }
    const homeScore = parseInt(homeTrim, 10);
    const awayScore = parseInt(awayTrim, 10);
    if (
      Number.isNaN(homeScore) ||
      Number.isNaN(awayScore) ||
      homeScore < 0 ||
      awayScore < 0
    ) {
      setMessage("Ошибка: счёт должен быть неотрицательным целым числом.");
      setSaving(false);
      return;
    }

    const incompleteEvent = events.find((e) => {
      const hasAny = Boolean(e.playerId || e.time.trim());
      if (!hasAny) return false;
      return !(
        e.playerId &&
        e.period !== "" &&
        e.time.trim() &&
        PROTOCOL_TIME_MMSS_RE.test(e.time.trim())
      );
    });
    if (incompleteEvent) {
      setMessage(
        "Ошибка: в событиях укажите игрока, период и время (mm:ss, четыре цифры), либо удалите неполную строку."
      );
      setSaving(false);
      return;
    }

    const incompletePenalty = penalties.find((p) => {
      const hasAny = Boolean(p.playerId || p.time.trim() || p.reason.trim());
      if (!hasAny) return false;
      return !(
        p.playerId &&
        p.period !== "" &&
        p.minutes !== "" &&
        p.time.trim() &&
        PROTOCOL_TIME_MMSS_RE.test(p.time.trim()) &&
        p.reason.trim()
      );
    });
    if (incompletePenalty) {
      setMessage(
        "Ошибка: в штрафах укажите игрока, минуты, период, причину и время (mm:ss, четыре цифры), либо удалите неполную строку."
      );
      setSaving(false);
      return;
    }

    const validEvents = events.filter(
      (e) =>
        e.playerId &&
        e.period !== "" &&
        e.time &&
        PROTOCOL_TIME_MMSS_RE.test(e.time.trim())
    );
    const validPenalties = penalties.filter(
      (p) =>
        p.playerId &&
        p.period !== "" &&
        p.minutes !== "" &&
        p.time &&
        PROTOCOL_TIME_MMSS_RE.test(p.time.trim()) &&
        p.reason.trim()
    );

    const goalieStats: {
      playerId: string;
      teamId: string;
      saves: number;
      goalsAgainst: number;
      shutout: boolean;
    }[] = [];
    for (const goalie of goalies) {
      const teamId = homePlayers.some((p) => p.id === goalie.id)
        ? homeTeamId
        : awayTeamId;
      const goalsAgainst = teamId === homeTeamId ? awayScore : homeScore;
      const f = goalieFields[goalie.id] ?? { savesStr: "0", shutout: false };
      const savesTrim = f.savesStr.trim();
      const savesParsed = savesTrim === "" ? 0 : parseInt(savesTrim, 10);
      if (Number.isNaN(savesParsed) || savesParsed < 0) {
        setMessage("Ошибка: укажите корректное неотрицательное число сэйвов.");
        setSaving(false);
        return;
      }
      goalieStats.push({
        playerId: goalie.id,
        teamId,
        saves: savesParsed,
        goalsAgainst,
        shutout: goalsAgainst === 0 && f.shutout,
      });
    }

    const validReferees = protocolReferees.filter((r) => r.refereeId.trim() !== "");

    const result = await replaceMatchProtocol(matchId, {
      homeScore,
      awayScore,
      overtime,
      shootout,
      events: validEvents.map((e) => ({
        type: e.type as never,
        playerId: e.playerId,
        teamId: e.teamId,
        period: Number(e.period),
        time: e.time.trim(),
      })),
      penalties: validPenalties.map((p) => ({
        playerId: p.playerId,
        teamId: p.teamId,
        minutes: Number(p.minutes),
        reason: p.reason.trim(),
        period: Number(p.period),
        time: p.time.trim(),
      })),
      goalieStats,
      referees: validReferees.map((r) => ({
        refereeId: r.refereeId,
        role: r.role.trim() || undefined,
      })),
    });

    if ("error" in result && result.error) {
      setMessage(`Ошибка: ${result.error}`);
      setSaving(false);
      return;
    }

    setMessage(
      hasFinishedResult
        ? "Изменения сохранены, таблица пересчитана."
        : "Протокол сохранён. Таблица пересчитана."
    );
    router.refresh();
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-semibold mb-4">Счёт матча</h3>
        <div className="flex items-center gap-4 justify-center">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-2">{homeTeamName}</p>
            <input
              type="number"
              min={0}
              step={1}
              value={homeScoreStr}
              onChange={(e) => setHomeScoreStr(e.target.value)}
              className="w-20 h-16 text-center text-3xl font-bold rounded-lg border border-gray-300 focus:border-blue-500 outline-none"
            />
          </div>
          <span className="text-2xl font-bold text-gray-400">:</span>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-2">{awayTeamName}</p>
            <input
              type="number"
              min={0}
              step={1}
              value={awayScoreStr}
              onChange={(e) => setAwayScoreStr(e.target.value)}
              className="w-20 h-16 text-center text-3xl font-bold rounded-lg border border-gray-300 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={overtime}
              onChange={(e) => setOvertime(e.target.checked)}
              className="rounded"
            />
            Овертайм
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shootout}
              onChange={(e) => setShootout(e.target.checked)}
              className="rounded"
            />
            Буллиты / Серия пенальти
          </label>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Судьи</h3>
          <button
            type="button"
            onClick={addProtocolReferee}
            disabled={leagueReferees.length === 0}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>
        {leagueReferees.length === 0 ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            В лиге пока нет судей в справочнике. Добавьте их в разделе «Судьи» в админке.
          </p>
        ) : protocolReferees.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2">
            Судьи не назначены — по желанию нажмите «Добавить».
          </p>
        ) : null}
        {protocolReferees.map((row, i) => (
          <div key={i} className="flex items-center gap-2 mb-3 flex-wrap">
            <select
              value={row.refereeId}
              onChange={(e) => updateProtocolReferee(i, "refereeId", e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm flex-1 min-w-[180px]"
            >
              <option value="">— Выберите судью —</option>
              {leagueReferees.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.lastName} {r.firstName}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={row.role}
              onChange={(e) => updateProtocolReferee(i, "role", e.target.value)}
              className="flex-1 min-w-[120px] rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              placeholder="Роль (главный, линейный…)"
            />
            <button
              type="button"
              onClick={() => removeProtocolReferee(i)}
              className="p-1.5 text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {goalies.length > 0 && (
        <div className="rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Вратари</h3>
          <div className="space-y-3">
            {goalies.map((g) => {
              const teamId = homePlayers.some((p) => p.id === g.id) ? homeTeamId : awayTeamId;
              const name = teamId === homeTeamId ? homeTeamName : awayTeamName;
              const f = goalieFields[g.id] ?? { savesStr: "0", shutout: false };
              return (
                <div
                  key={g.id}
                  className="flex flex-wrap items-center gap-3 text-sm border-b border-gray-100 pb-3 last:border-0"
                >
                  <span className="font-medium text-gray-900 min-w-[140px]">
                    {g.lastName} {g.firstName}
                  </span>
                  <span className="text-gray-500 text-xs">{name}</span>
                  <label className="flex items-center gap-1 ml-auto">
                    <span className="text-gray-600">Сэйвы</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={f.savesStr}
                      onChange={(e) =>
                        setGoalieFields((prev) => ({
                          ...prev,
                          [g.id]: {
                            ...f,
                            savesStr: e.target.value,
                          },
                        }))
                      }
                      className="w-20 rounded border border-gray-300 px-2 py-1 text-center"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={f.shutout}
                      onChange={(e) =>
                        setGoalieFields((prev) => ({
                          ...prev,
                          [g.id]: { ...f, shutout: e.target.checked },
                        }))
                      }
                      className="rounded"
                    />
                    Сухой матч
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            События ({sportConfig.terminology.period})
          </h3>
          <button
            type="button"
            onClick={addEvent}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>

        {events.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            Нажмите «Добавить» для внесения событий матча
          </p>
        )}

        {events.map((event, i) => (
          <div key={i} className="flex items-center gap-2 mb-3 flex-wrap">
            <select
              value={event.type}
              onChange={(e) => updateEvent(i, "type", e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            >
              {sportConfig.eventTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={event.teamId}
              onChange={(e) => updateEvent(i, "teamId", e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value={homeTeamId}>{homeTeamName}</option>
              <option value={awayTeamId}>{awayTeamName}</option>
            </select>
            <select
              value={event.playerId}
              onChange={(e) => updateEvent(i, "playerId", e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm flex-1 min-w-[120px]"
            >
              <option value="">— Игрок —</option>
              {getPlayersForTeam(event.teamId).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.lastName} {p.firstName}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={sportConfig.terminology.periods + 2}
              value={event.period === "" ? "" : event.period}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") updateEvent(i, "period", "");
                else {
                  const n = parseInt(v, 10);
                  if (!Number.isNaN(n)) updateEvent(i, "period", n);
                }
              }}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
            />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={5}
              title="Время в периоде: четыре цифры, формат mm:ss (например 05:30)"
              value={event.time}
              onChange={(e) =>
                updateEvent(i, "time", applyMmSsMask(event.time, e.target.value))
              }
              className="w-[4.5rem] rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center tabular-nums"
              placeholder="mm:ss"
            />
            <button
              type="button"
              onClick={() => removeEvent(i)}
              className="p-1.5 text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Штрафы / Нарушения</h3>
          <button
            type="button"
            onClick={addPenaltyEntry}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>

        {penalties.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            Нет штрафов
          </p>
        )}

        {penalties.map((pen, i) => (
          <div key={i} className="flex items-center gap-2 mb-3 flex-wrap">
            <select
              value={pen.teamId}
              onChange={(e) => updatePenaltyEntry(i, "teamId", e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value={homeTeamId}>{homeTeamName}</option>
              <option value={awayTeamId}>{awayTeamName}</option>
            </select>
            <select
              value={pen.playerId}
              onChange={(e) => updatePenaltyEntry(i, "playerId", e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm flex-1 min-w-[120px]"
            >
              <option value="">— Игрок —</option>
              {getPlayersForTeam(pen.teamId).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.lastName} {p.firstName}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={pen.minutes === "" ? "" : pen.minutes}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") updatePenaltyEntry(i, "minutes", "");
                else {
                  const n = parseInt(v, 10);
                  if (!Number.isNaN(n)) updatePenaltyEntry(i, "minutes", n);
                }
              }}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
            />
            <input
              type="text"
              value={pen.reason}
              onChange={(e) => updatePenaltyEntry(i, "reason", e.target.value)}
              className="flex-1 min-w-[100px] rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              placeholder="Причина"
            />
            <input
              type="number"
              min={1}
              value={pen.period === "" ? "" : pen.period}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") updatePenaltyEntry(i, "period", "");
                else {
                  const n = parseInt(v, 10);
                  if (!Number.isNaN(n)) updatePenaltyEntry(i, "period", n);
                }
              }}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
            />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={5}
              title="Время в периоде: четыре цифры, формат mm:ss (например 05:30)"
              value={pen.time}
              onChange={(e) =>
                updatePenaltyEntry(i, "time", applyMmSsMask(pen.time, e.target.value))
              }
              className="w-[4.5rem] rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center tabular-nums"
              placeholder="mm:ss"
            />
            <button
              type="button"
              onClick={() => removePenalty(i)}
              className="p-1.5 text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {message && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            message.startsWith("Ошибка:")
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving
          ? "Сохранение..."
          : hasFinishedResult
            ? "Сохранить изменения и пересчитать таблицу"
            : "Сохранить протокол и пересчитать таблицу"}
      </button>
    </div>
  );
}
