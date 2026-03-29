"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createTournament } from "@/actions/tournaments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "REGULAR", label: "Регулярный чемпионат" },
  { value: "PLAYOFF", label: "Плей-офф" },
  { value: "GROUP_STAGE", label: "Групповой этап" },
  { value: "CUP", label: "Кубок" },
];

export function TournamentCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const emblem = fd.get("emblem");
    if (!emblem || String(emblem).trim() === "") {
      fd.delete("emblem");
    }
    startTransition(async () => {
      const r = await createTournament(fd);
      if (r.error) {
        setError(r.error);
        return;
      }
      form.reset();
      setOpen(false);
      router.refresh();
      if (r.id) {
        router.push(`/admin/tournaments/${r.id}`);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-0">
      <Button type="button" variant="primary" size="md" onClick={() => setOpen((v) => !v)} className="gap-2 shrink-0">
        <Plus className="w-4 h-4" />
        {open ? "Скрыть форму" : "Создать турнир"}
      </Button>
      {open && (
        <form
          onSubmit={onSubmit}
          className="mt-4 w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 text-left"
        >
          <h2 className="text-sm font-semibold text-gray-900">Новый турнир</h2>
          <Input name="name" label="Название *" required disabled={pending} placeholder="Например: Весенний кубок 2026" />
          <Input
            name="emblem"
            label="Эмблема (URL, необязательно)"
            type="url"
            disabled={pending}
            placeholder="https://…"
          />
          <div>
            <label htmlFor="tournament-type" className="block text-sm font-medium text-gray-700 mb-1">
              Тип турнира
            </label>
            <select
              id="tournament-type"
              name="type"
              disabled={pending}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              defaultValue="REGULAR"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Создание…" : "Создать"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
