"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCoach, updateCoach } from "@/actions/coaches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TeamOption = { id: string; name: string };

type Initial = {
  firstName: string;
  lastName: string;
  photo: string | null;
  teamId: string | null;
};

export function CoachAdminForm({
  mode,
  coachId,
  teams,
  initial,
  onDone,
}: {
  mode: "create" | "edit";
  coachId?: string;
  teams: TeamOption[];
  initial?: Initial;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const photo = fd.get("photo");
    if (!photo || String(photo).trim() === "") fd.delete("photo");
    const teamId = fd.get("teamId");
    if (!teamId || String(teamId).trim() === "") fd.delete("teamId");

    startTransition(async () => {
      const r =
        mode === "create" ? await createCoach(fd) : await updateCoach(coachId!, fd);
      if (r.error) {
        setError(r.error);
        return;
      }
      if (mode === "create") {
        form.reset();
        onDone?.();
      }
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 text-left"
    >
      <h2 className="text-sm font-semibold text-gray-900">
        {mode === "create" ? "Новый тренер" : "Редактирование тренера"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="lastName"
          label="Фамилия *"
          required
          disabled={pending}
          defaultValue={initial?.lastName ?? ""}
        />
        <Input
          name="firstName"
          label="Имя *"
          required
          disabled={pending}
          defaultValue={initial?.firstName ?? ""}
        />
      </div>
      <Input
        name="photo"
        label="Фото (URL)"
        type="url"
        disabled={pending}
        placeholder="https://…"
        defaultValue={initial?.photo ?? ""}
      />
      <div>
        <label htmlFor="coach-team" className="block text-sm font-medium text-gray-700 mb-1">
          Команда (необязательно)
        </label>
        <select
          id="coach-team"
          name="teamId"
          disabled={pending}
          defaultValue={initial?.teamId ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Без команды</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2 justify-end pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Сохранение…" : mode === "create" ? "Добавить" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
