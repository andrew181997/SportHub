"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTeam } from "@/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Team = {
  id: string;
  name: string;
  city: string | null;
  foundedYear: number | null;
  description: string | null;
  contactEmail: string | null;
  logo: string | null;
};

export function TeamEditForm({ team }: { team: Team }) {
  const router = useRouter();
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
    const logo = fd.get("logo");
    if (!logo || String(logo).trim() === "") {
      fd.delete("logo");
    }
    startTransition(async () => {
      const r = await updateTeam(team.id, fd);
      if (r.error) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
    >
      <h2 className="text-sm font-semibold text-gray-900">Данные команды</h2>
      <Input
        name="name"
        label="Название *"
        required
        disabled={pending}
        defaultValue={team.name}
      />
      <Input
        name="logo"
        label="Логотип (URL)"
        type="url"
        disabled={pending}
        placeholder="https://…"
        defaultValue={team.logo ?? ""}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="city" label="Город" disabled={pending} defaultValue={team.city ?? ""} />
        <Input
          name="foundedYear"
          label="Год основания"
          type="number"
          min={1800}
          max={2100}
          disabled={pending}
          defaultValue={team.foundedYear ?? ""}
        />
      </div>
      <Input
        name="contactEmail"
        label="Email для связи"
        type="email"
        autoComplete="email"
        disabled={pending}
        defaultValue={team.contactEmail ?? ""}
      />
      <div>
        <label htmlFor="team-edit-desc" className="block text-sm font-medium text-gray-700 mb-1">
          Описание
        </label>
        <textarea
          id="team-edit-desc"
          name="description"
          rows={3}
          disabled={pending}
          defaultValue={team.description ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2 justify-end pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
