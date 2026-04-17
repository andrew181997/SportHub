"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createMatch } from "@/actions/matches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface MatchFormTournament {
  id: string;
  name: string;
  type: string;
}

export interface MatchFormPlayoffSeries {
  id: string;
  tournamentId: string;
  label: string;
}

export interface MatchFormTeam {
  id: string;
  name: string;
}

export interface TournamentParticipants {
  tournamentId: string;
  teams: MatchFormTeam[];
}

interface Props {
  tournaments: MatchFormTournament[];
  /** Команды, заявленные в турнир (таблица Standing). */
  participantsByTournament: TournamentParticipants[];
  playoffSeries: MatchFormPlayoffSeries[];
}

export function MatchCreateForm({
  tournaments,
  participantsByTournament,
  playoffSeries,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [tournamentId, setTournamentId] = useState("");
  const [playoffMode, setPlayoffMode] = useState<"new" | "existing">("new");

  const hasAnyTournamentWithEnoughTeams = useMemo(
    () =>
      participantsByTournament.some((p) => p.teams.length >= 2),
    [participantsByTournament]
  );

  const canCreate = tournaments.length > 0 && hasAnyTournamentWithEnoughTeams;

  const selectedTournament = useMemo(
    () => tournaments.find((t) => t.id === tournamentId),
    [tournamentId, tournaments]
  );

  const teamsInSelectedTournament = useMemo(() => {
    if (!tournamentId) return [];
    return (
      participantsByTournament.find((p) => p.tournamentId === tournamentId)
        ?.teams ?? []
    );
  }, [participantsByTournament, tournamentId]);

  const isPlayoff = selectedTournament?.type === "PLAYOFF";

  const seriesForTournament = useMemo(
    () => playoffSeries.filter((s) => s.tournamentId === tournamentId),
    [playoffSeries, tournamentId]
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const tournamentIdVal = fd.get("tournamentId");
    if (!tournamentIdVal || String(tournamentIdVal).trim() === "") {
      setError("Выберите турнир.");
      return;
    }
    const datetime = fd.get("datetime");
    if (!datetime || String(datetime).trim() === "") {
      setError("Укажите дату и время матча.");
      return;
    }
    const homeTeamId = fd.get("homeTeamId");
    const awayTeamId = fd.get("awayTeamId");
    if (!homeTeamId || String(homeTeamId).trim() === "") {
      setError("Выберите команду хозяев.");
      return;
    }
    if (!awayTeamId || String(awayTeamId).trim() === "") {
      setError("Выберите команду гостей.");
      return;
    }
    const venue = fd.get("venue");
    if (!venue || String(venue).trim() === "") {
      fd.delete("venue");
    }
    const round = fd.get("round");
    if (!round || String(round).trim() === "") {
      fd.delete("round");
    }
    startTransition(async () => {
      const r = await createMatch(fd);
      if (r.error) {
        setError(r.error);
        return;
      }
      form.reset();
      setTournamentId("");
      setPlayoffMode("new");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-0">
      <Button
        type="button"
        variant="primary"
        size="md"
        onClick={() => canCreate && setOpen((v) => !v)}
        disabled={!canCreate}
        className="gap-2 shrink-0"
        title={
          !canCreate
            ? "Нужен хотя бы один турнир с двумя заявленными в нём командами"
            : undefined
        }
      >
        <Plus className="w-4 h-4" />
        {open ? "Скрыть форму" : "Добавить матч"}
      </Button>
      {!canCreate && (
        <p className="mt-2 max-w-sm text-right text-xs text-amber-700">
          Создайте турнир и добавьте в него минимум две команды (участники турнира), затем можно планировать матчи.
        </p>
      )}
      {open && canCreate && (
        <form
          onSubmit={onSubmit}
          className="mt-4 w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 text-left"
        >
          <h2 className="text-sm font-semibold text-gray-900">Новый матч</h2>
          <div>
            <label htmlFor="match-tournament" className="block text-sm font-medium text-gray-700 mb-1">
              Турнир *
            </label>
            <select
              id="match-tournament"
              name="tournamentId"
              required
              disabled={pending}
              value={tournamentId}
              onChange={(e) => {
                setTournamentId(e.target.value);
                setPlayoffMode("new");
                setError("");
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Выберите турнир —</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {isPlayoff && (
            <div className="rounded-lg border border-violet-200 bg-violet-50/80 p-3 space-y-3">
              <p className="text-xs font-medium text-violet-900">Плей-офф: серия</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="playoffSeriesMode"
                    value="new"
                    checked={playoffMode === "new"}
                    onChange={() => setPlayoffMode("new")}
                    disabled={pending}
                  />
                  Новая серия (первый матч)
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="playoffSeriesMode"
                    value="existing"
                    checked={playoffMode === "existing"}
                    onChange={() => setPlayoffMode("existing")}
                    disabled={pending}
                  />
                  Матч в существующей серии
                </label>
              </div>
              {playoffMode === "new" && (
                <Input
                  name="newSeriesLabel"
                  label="Подпись серии (необязательно)"
                  disabled={pending}
                  placeholder="Например: 1/4 финала"
                />
              )}
              {playoffMode === "existing" && (
                <div>
                  <label htmlFor="playoff-series" className="block text-sm font-medium text-gray-700 mb-1">
                    Серия *
                  </label>
                  <select
                    id="playoff-series"
                    name="playoffSeriesId"
                    required={playoffMode === "existing"}
                    disabled={pending || seriesForTournament.length === 0}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">— Выберите серию —</option>
                    {seriesForTournament.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {seriesForTournament.length === 0 ? (
                    <p className="mt-1 text-xs text-amber-800">
                      Нет серий в этом турнире. Создайте первый матч как «Новая серия».
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-600">
                      Команды матча должны совпадать с участниками серии (хозяева и гости можно поменять местами).
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <Input
            name="datetime"
            label="Дата и время *"
            type="datetime-local"
            required
            disabled={pending}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="match-home" className="block text-sm font-medium text-gray-700 mb-1">
                Хозяева *
              </label>
              <select
                id="match-home"
                name="homeTeamId"
                required
                disabled={pending || !tournamentId || teamsInSelectedTournament.length < 2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— Команда —</option>
                {teamsInSelectedTournament.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="match-away" className="block text-sm font-medium text-gray-700 mb-1">
                Гости *
              </label>
              <select
                id="match-away"
                name="awayTeamId"
                required
                disabled={pending || !tournamentId || teamsInSelectedTournament.length < 2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— Команда —</option>
                {teamsInSelectedTournament.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {tournamentId && teamsInSelectedTournament.length < 2 ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              В этом турнире меньше двух заявленных команд. Откройте карточку турнира в админке и добавьте участников
              турнира, затем создавайте матч.
            </p>
          ) : null}
          <Input name="venue" label="Площадка" disabled={pending} />
          <Input name="round" label="Тур (номер)" type="number" min={1} disabled={pending} />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={
                pending ||
                !tournamentId ||
                teamsInSelectedTournament.length < 2
              }
            >
              {pending ? "Сохранение…" : "Создать матч"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
