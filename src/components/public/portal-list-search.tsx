"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { LIST_SEARCH_MAX_LEN, LIST_SEARCH_PARAM } from "@/lib/public-filters";

type Props = {
  placeholder: string;
  className?: string;
};

export function PortalListSearch({ placeholder, className = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qFromUrl = sp.get(LIST_SEARCH_PARAM) ?? "";
  const [value, setValue] = useState(qFromUrl);

  useEffect(() => {
    setValue(qFromUrl);
  }, [qFromUrl]);

  const applySearch = useCallback(
    (raw: string) => {
      const next = new URLSearchParams(sp.toString());
      const trimmed = raw.trim().slice(0, LIST_SEARCH_MAX_LEN);
      if (trimmed) next.set(LIST_SEARCH_PARAM, trimmed);
      else next.delete(LIST_SEARCH_PARAM);
      next.delete("page");
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, sp]
  );

  return (
    <form
      role="search"
      className={`flex w-full max-w-md flex-col gap-2 sm:max-w-sm ${className}`.trim()}
      onSubmit={(e) => {
        e.preventDefault();
        applySearch(value);
      }}
    >
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            name={LIST_SEARCH_PARAM}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, LIST_SEARCH_MAX_LEN))}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-100"
        >
          Найти
        </button>
      </div>
      {qFromUrl ? (
        <button
          type="button"
          className="self-start text-xs text-slate-600 underline underline-offset-2 hover:text-slate-900"
          onClick={() => {
            setValue("");
            const next = new URLSearchParams(sp.toString());
            next.delete(LIST_SEARCH_PARAM);
            next.delete("page");
            const qs = next.toString();
            router.push(qs ? `${pathname}?${qs}` : pathname);
          }}
        >
          Сбросить поиск
        </button>
      ) : null}
    </form>
  );
}
