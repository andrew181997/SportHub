"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { replaceMatchProtocol } from "@/actions/matches";
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
  period: number;
  time: string;
}

interface PenaltyEntry {
  playerId: string;
  teamId: string;
  minutes: number;
  reason: string;
  period: number;
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
}

const TIME_RE = /^\d{1,2}:\d{2}$/;

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
}: Props) {
  const router = useRouter();
  const [homeScore, setHomeScore] = useState(initialProtocol?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(initialProtocol?.awayScore ?? 0);
  const [overtime, setOvertime] = useState(initialProtocol?.overtime ?? false);
  const [shootout, setShootout] = useState(initialProtocol?.shootout ?? false);
  const [events, setEvents] = useState<ProtocolEvent[]>(() =>
    (initialProtocol?.events ?? []).map((e) => ({ ...e }))
  );
  const [penalties, setPenalties] = useState<PenaltyEntry[]>(() =>
    (initialProtocol?.penalties ?? []).map((p) => ({ ...p }))
  );
  const [goalieFields, setGoalieFields] = useState<
    Record<string, { saves: number; shutout: boolean }>
  >(() => {
    const m: Record<string, { saves: number; shutout: boolean }> = {};
    for (const g of initialProtocol?.goalieStats ?? []) {
      m[g.playerId] = { saves: g.saves, shutout: g.shutout };
    }
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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

    const validEvents = events.filter(
      (e) => e.playerId && e.time && TIME_RE.test(e.time.trim())
    );
    const validPenalties = penalties.filter(
      (p) => p.playerId && p.time && TIME_RE.test(p.time.trim()) && p.reason.trim()
    );

    const goalieStats = goalies.map((goalie) => {
      const teamId = homePlayers.some((p) => p.id === goalie.id)
        ? homeTeamId
        : awayTeamId;
      const goalsAgainst = teamId === homeTeamId ? awayScore : homeScore;
      const f = goalieFields[goalie.id] ?? { saves: 0, shutout: false };
      return {
        playerId: goalie.id,
        teamId,
        saves: f.saves,
        goalsAgainst,
        shutout: goalsAgainst === 0 && f.shutout,
      };
    });

    const result = await replaceMatchProtocol(matchId, {
      homeScore,
      awayScore,
      overtime,
      shootout,
      events: validEvents.map((e) => ({
        type: e.type as never,
        playerId: e.playerId,
        teamId: e.teamId,
        period: e.period,
        time: e.time.trim(),
      })),
      penalties: validPenalties.map((p) => ({
        playerId: p.playerId,
        teamId: p.teamId,
        minutes: p.minutes,
        reason: p.reason.trim(),
        period: p.period,
        time: p.time.trim(),
      })),
      goalieStats,
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
              value={homeScore}
              onChange={(e) => setHomeScore(Number(e.target.value))}
              className="w-20 h-16 text-center text-3xl font-bold rounded-lg border border-gray-300 focus:border-blue-500 outline-none"
            />
          </div>
          <span className="text-2xl font-bold text-gray-400">:</span>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-2">{awayTeamName}</p>
            <input
              type="number"
              min={0}
              value={awayScore}
              onChange={(e) => setAwayScore(Number(e.target.value))}
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

      {goalies.length > 0 && (
        <div className="rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Вратари</h3>
          <div className="space-y-3">
            {goalies.map((g) => {
              const teamId = homePlayers.some((p) => p.id === g.id) ? homeTeamId : awayTeamId;
              const name = teamId === homeTeamId ? homeTeamName : awayTeamName;
              const f = goalieFields[g.id] ?? { saves: 0, shutout: false };
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
                      value={f.saves}
                      onChange={(e) =>
                        setGoalieFields((prev) => ({
                          ...prev,
                          [g.id]: {
                            ...f,
                            saves: Number(e.target.value) || 0,
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
              value={event.period}
              onChange={(e) => updateEvent(i, "period", Number(e.target.value))}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
            />
            <input
              type="text"
              value={event.time}
              onChange={(e) => updateEvent(i, "time", e.target.value)}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
              placeholder="MM:SS"
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
              value={pen.minutes}
              onChange={(e) => updatePenaltyEntry(i, "minutes", Number(e.target.value))}
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
              value={pen.period}
              onChange={(e) => updatePenaltyEntry(i, "period", Number(e.target.value))}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
            />
            <input
              type="text"
              value={pen.time}
              onChange={(e) => updatePenaltyEntry(i, "time", e.target.value)}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
              placeholder="MM:SS"
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
