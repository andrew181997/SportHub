"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createPlayer } from "@/actions/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PositionOption {
  value: string;
  label: string;
}

type TeamOption = { id: string; name: string };

export function PlayerCreateForm({
  positions,
  teams,
  defaultTeamId,
}: {
  positions: PositionOption[];
  teams: TeamOption[];
  /** При открытии списка с фильтром по команде — предвыбрать команду */
  defaultTeamId?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const birth = fd.get("birthDate");
    if (!birth || String(birth).trim() === "") {
      fd.delete("birthDate");
    }
    const team = fd.get("teamId");
    if (!team || String(team).trim() === "") {
      fd.delete("teamId");
    }
    startTransition(async () => {
      const r = await createPlayer(fd);
      if (r.error) {
        setError(r.error);
        return;
      }
      form.reset();
      setOpen(false);
      router.refresh();
    });
  }

  const canAssignTeam = teams.length > 0;

  return (
    <div className="flex flex-col items-end gap-0">
      <Button type="button" variant="primary" size="md" onClick={() => setOpen((v) => !v)} className="gap-2 shrink-0">
        <Plus className="w-4 h-4" />
        {open ? "Скрыть форму" : "Добавить игрока"}
      </Button>
      {open && (
        <form
          onSubmit={onSubmit}
          className="mt-4 w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 text-left"
        >
          <h2 className="text-sm font-semibold text-gray-900">Новый игрок</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="lastName" label="Фамилия *" required autoComplete="family-name" disabled={pending} />
            <Input name="firstName" label="Имя *" required autoComplete="given-name" disabled={pending} />
          </div>
          <Input name="middleName" label="Отчество" disabled={pending} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="birthDate" label="Дата рождения" type="date" disabled={pending} />
            <div>
              <label htmlFor="player-role" className="block text-sm font-medium text-gray-700 mb-1">
                Амплуа
              </label>
              <select
                id="player-role"
                name="role"
                disabled={pending}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                defaultValue={
                  positions.find((p) => p.value === "FORWARD")?.value ??
                  positions[0]?.value ??
                  "FORWARD"
                }
              >
                {positions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {canAssignTeam ? (
            <div>
              <label htmlFor="player-team" className="block text-sm font-medium text-gray-700 mb-1">
                Команда (необязательно)
              </label>
              <select
                id="player-team"
                name="teamId"
                disabled={pending}
                defaultValue={defaultTeamId ?? ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Без команды</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                При выборе команды игрок сразу попадает в её состав.
              </p>
            </div>
          ) : (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Сначала создайте команду, чтобы назначать игрока при добавлении.
            </p>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Сохранение…" : "Создать"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
