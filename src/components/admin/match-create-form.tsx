"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createMatch } from "@/actions/matches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface MatchFormTournament {
  id: string;
  name: string;
}

export interface MatchFormTeam {
  id: string;
  name: string;
}

interface Props {
  tournaments: MatchFormTournament[];
  teams: MatchFormTeam[];
}

export function MatchCreateForm({ tournaments, teams }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const canCreate = tournaments.length > 0 && teams.length >= 2;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
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
            ? "Нужен хотя бы один турнир и две команды"
            : undefined
        }
      >
        <Plus className="w-4 h-4" />
        {open ? "Скрыть форму" : "Добавить матч"}
      </Button>
      {!canCreate && (
        <p className="mt-2 max-w-sm text-right text-xs text-amber-700">
          Создайте турнир и минимум две команды, чтобы планировать матчи.
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
                disabled={pending}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— Команда —</option>
                {teams.map((t) => (
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
                disabled={pending}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— Команда —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Input name="venue" label="Площадка" disabled={pending} />
          <Input name="round" label="Тур (номер)" type="number" min={1} disabled={pending} />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Сохранение…" : "Создать матч"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
