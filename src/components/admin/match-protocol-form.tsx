"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { addMatchEvent, addPenalty, saveGoalieStats, updateMatchResult } from "@/actions/matches";
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

interface Props {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: Player[];
  awayPlayers: Player[];
  sportConfig: SportConfig;
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
}: Props) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [overtime, setOvertime] = useState(false);
  const [shootout, setShootout] = useState(false);
  const [events, setEvents] = useState<ProtocolEvent[]>([]);
  const [penalties, setPenalties] = useState<PenaltyEntry[]>([]);
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

  const updateEvent = (index: number, field: string, value: string | number) => {
    const updated = [...events];
    (updated[index] as Record<string, string | number>)[field] = value;
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

  const updatePenaltyEntry = (index: number, field: string, value: string | number) => {
    const updated = [...penalties];
    (updated[index] as Record<string, string | number>)[field] = value;
    setPenalties(updated);
  };

  const getPlayersForTeam = (teamId: string) =>
    teamId === homeTeamId ? homePlayers : awayPlayers;

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const resultForm = new FormData();
      resultForm.set("homeScore", homeScore.toString());
      resultForm.set("awayScore", awayScore.toString());
      resultForm.set("overtime", overtime.toString());
      resultForm.set("shootout", shootout.toString());
      await updateMatchResult(matchId, resultForm);

      for (const event of events) {
        if (!event.playerId || !event.time) continue;
        const eventForm = new FormData();
        eventForm.set("type", event.type);
        eventForm.set("playerId", event.playerId);
        eventForm.set("teamId", event.teamId);
        eventForm.set("period", event.period.toString());
        eventForm.set("time", event.time);
        await addMatchEvent(matchId, eventForm);
      }

      for (const penalty of penalties) {
        if (!penalty.playerId || !penalty.time) continue;
        const penaltyForm = new FormData();
        penaltyForm.set("playerId", penalty.playerId);
        penaltyForm.set("teamId", penalty.teamId);
        penaltyForm.set("minutes", penalty.minutes.toString());
        penaltyForm.set("reason", penalty.reason);
        penaltyForm.set("period", penalty.period.toString());
        penaltyForm.set("time", penalty.time);
        await addPenalty(matchId, penaltyForm);
      }

      const goalies = [...homePlayers, ...awayPlayers].filter(
        (p) => p.role === "GOALIE"
      );
      for (const goalie of goalies) {
        const teamId = homePlayers.includes(goalie) ? homeTeamId : awayTeamId;
        const goalsAgainst = teamId === homeTeamId ? awayScore : homeScore;
        await saveGoalieStats(matchId, {
          playerId: goalie.id,
          teamId,
          saves: 0,
          goalsAgainst,
          shutout: goalsAgainst === 0,
        });
      }

      setMessage("Протокол сохранён. Таблица пересчитана.");
    } catch {
      setMessage("Ошибка при сохранении протокола");
    } finally {
      setSaving(false);
    }
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

      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            События ({sportConfig.terminology.period})
          </h3>
          <button
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
                <option key={t.value} value={t.value}>{t.label}</option>
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
              placeholder={sportConfig.terminology.period}
            />
            <input
              type="text"
              value={event.time}
              onChange={(e) => updateEvent(i, "time", e.target.value)}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
              placeholder="MM:SS"
            />
            <button
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
              placeholder="мин"
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
              placeholder="П"
            />
            <input
              type="text"
              value={pen.time}
              onChange={(e) => updatePenaltyEntry(i, "time", e.target.value)}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
              placeholder="MM:SS"
            />
            <button
              onClick={() => removePenalty(i)}
              className="p-1.5 text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {message && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "Сохранение протокола..." : "Сохранить протокол и пересчитать таблицу"}
      </button>
    </div>
  );
}
