"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createTeam } from "@/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TournamentOption = { id: string; name: string };

export function TeamCreateForm({ tournaments = [] }: { tournaments?: TournamentOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const year = fd.get("foundedYear");
    if (!year || String(year).trim() === "") {
      fd.delete("foundedYear");
    }
    const tr = fd.get("tournamentId");
    if (!tr || String(tr).trim() === "") {
      fd.delete("tournamentId");
    }
    const logo = fd.get("logo");
    if (!logo || String(logo).trim() === "") {
      fd.delete("logo");
    }
    startTransition(async () => {
      const r = await createTeam(fd);
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
      <Button type="button" variant="primary" size="md" onClick={() => setOpen((v) => !v)} className="gap-2 shrink-0">
        <Plus className="w-4 h-4" />
        {open ? "Скрыть форму" : "Добавить команду"}
      </Button>
      {open && (
        <form
          onSubmit={onSubmit}
          className="mt-4 w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 text-left"
        >
          <h2 className="text-sm font-semibold text-gray-900">Новая команда</h2>
          <Input name="name" label="Название *" required disabled={pending} />
          <Input
            name="logo"
            label="Логотип (URL, необязательно)"
            type="url"
            disabled={pending}
            placeholder="https://…"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="city" label="Город" disabled={pending} />
            <Input name="foundedYear" label="Год основания" type="number" min={1800} max={2100} disabled={pending} />
          </div>
          <Input name="contactEmail" label="Email для связи" type="email" autoComplete="email" disabled={pending} />
          {tournaments.length > 0 ? (
            <div>
              <label htmlFor="team-tournament" className="block text-sm font-medium text-gray-700 mb-1">
                Сразу добавить в турнир (необязательно)
              </label>
              <select
                id="team-tournament"
                name="tournamentId"
                disabled={pending}
                defaultValue=""
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Не добавлять</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Команда появится в турнирной таблице с нулевой статистикой; позже можно добавить матчи.
              </p>
            </div>
          ) : null}
          <div>
            <label htmlFor="team-desc" className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              id="team-desc"
              name="description"
              rows={3}
              disabled={pending}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
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
