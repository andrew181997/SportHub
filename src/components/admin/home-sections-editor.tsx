"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  LayoutGrid,
  Loader2,
  Save,
} from "lucide-react";
import { updateHomeSections } from "@/actions/settings";
import {
  HOME_SECTION_HINTS,
  HOME_SECTION_LABELS,
  type HomeSectionConfig,
  type HomeSectionType,
} from "@/lib/home-sections";
import { Button } from "@/components/ui/button";

export function HomeSectionsEditor({ initial }: { initial: HomeSectionConfig[] }) {
  const router = useRouter();
  const [sections, setSections] = useState<HomeSectionConfig[]>(() =>
    [...initial].sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i }))
  );
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const ordered = [...sections].sort((a, b) => a.order - b.order);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...ordered];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setSections(next.map((s, i) => ({ ...s, order: i })));
    setMessage(null);
  };

  const toggle = (type: HomeSectionType) => {
    setSections((prev) =>
      prev.map((s) => (s.type === type ? { ...s, visible: !s.visible } : s))
    );
    setMessage(null);
  };

  const save = () => {
    setMessage(null);
    const payload = [...sections].sort((a, b) => a.order - b.order).map((s, i) => ({
      ...s,
      order: i,
    }));
    startTransition(async () => {
      const r = await updateHomeSections(payload);
      if ("error" in r && r.error) {
        setMessage({ type: "err", text: r.error });
        return;
      }
      setMessage({
        type: "ok",
        text: "Сохранено. Изменения уже на главной странице сайта.",
      });
      router.refresh();
    });
  };

  const reset = () => {
    setSections(
      [...initial].sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i }))
    );
    setMessage(null);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="w-7 h-7 text-violet-600 shrink-0" />
            Блоки главной страницы
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Включайте и отключайте блоки, меняйте порядок — так посетители видят главную
            страницу лиги. Сохранение применяется сразу на портале.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 rounded-lg border p-3 text-sm ${
            message.type === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <ol className="mt-8 space-y-2">
        {ordered.map((section, index) => (
          <li
            key={section.type}
            className={`flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:gap-4 ${
              section.visible ? "bg-white border-slate-200 shadow-sm" : "bg-slate-50 border-slate-100 opacity-80"
            }`}
          >
            <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
              <button
                type="button"
                aria-label="Выше"
                disabled={index === 0 || pending}
                onClick={() => move(index, -1)}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Ниже"
                disabled={index === ordered.length - 1 || pending}
                onClick={() => move(index, 1)}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{HOME_SECTION_LABELS[section.type]}</p>
              {HOME_SECTION_HINTS[section.type] ? (
                <p className="text-xs text-gray-500 mt-0.5">{HOME_SECTION_HINTS[section.type]}</p>
              ) : null}
              <p className="text-[11px] text-gray-400 font-mono mt-1">{section.type}</p>
            </div>

            <button
              type="button"
              onClick={() => toggle(section.type)}
              disabled={pending}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium shrink-0 ${
                section.visible
                  ? "bg-violet-100 text-violet-900 hover:bg-violet-200/80"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300/80"
              }`}
            >
              {section.visible ? (
                <>
                  <Eye className="w-4 h-4" />
                  Включён
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Скрыт
                </>
              )}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={pending}
          onClick={save}
          className="gap-2"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Сохранить
        </Button>
        <button
          type="button"
          disabled={pending}
          onClick={reset}
          className="text-sm text-slate-600 hover:text-slate-900 underline underline-offset-2"
        >
          Вернуть как при открытии страницы
        </button>
      </div>

      <p className="mt-8 text-xs text-gray-400 leading-relaxed">
        Совет: отключите редко используемые блоки, чтобы главная загружалась быстрее и выглядела
        аккуратнее. Баннер с названием лиги можно скрыть, если нужна только лента матчей.
      </p>
    </div>
  );
}
