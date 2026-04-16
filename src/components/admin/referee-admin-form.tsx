"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReferee, updateReferee } from "@/actions/referees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Initial = {
  firstName: string;
  lastName: string;
  photo: string | null;
  category: string | null;
};

export function RefereeAdminForm({
  mode,
  refereeId,
  initial,
  onDone,
}: {
  mode: "create" | "edit";
  refereeId?: string;
  initial?: Initial;
  /** После успешного создания (например закрыть панель) */
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
    for (const key of ["photo", "category"] as const) {
      const v = fd.get(key);
      if (!v || String(v).trim() === "") fd.delete(key);
    }
    startTransition(async () => {
      const r =
        mode === "create"
          ? await createReferee(fd)
          : await updateReferee(refereeId!, fd);
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
        {mode === "create" ? "Новый судья" : "Редактирование судьи"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="lastName"
          label="Фамилия *"
          required
          disabled={pending}
          defaultValue={initial?.lastName ?? ""}
          autoComplete="family-name"
        />
        <Input
          name="firstName"
          label="Имя *"
          required
          disabled={pending}
          defaultValue={initial?.firstName ?? ""}
          autoComplete="given-name"
        />
      </div>
      <Input
        name="category"
        label="Категория / разряд"
        disabled={pending}
        defaultValue={initial?.category ?? ""}
      />
      <Input
        name="photo"
        label="Фото (URL)"
        type="url"
        disabled={pending}
        placeholder="https://…"
        defaultValue={initial?.photo ?? ""}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2 justify-end pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Сохранение…" : mode === "create" ? "Добавить" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
