"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TOURNAMENT_FILTER_PARAM } from "@/lib/public-filters";

type Props = {
  tournaments: { id: string; name: string }[];
  className?: string;
};

export function TournamentFilter({ tournaments, className = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = sp.get(TOURNAMENT_FILTER_PARAM) ?? "";

  if (tournaments.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`.trim()}
    >
      <label
        htmlFor="filter-tournament"
        className="text-sm font-medium text-slate-600 whitespace-nowrap"
      >
        Турнир
      </label>
      <select
        id="filter-tournament"
        value={current}
        onChange={(e) => {
          const value = e.target.value;
          const next = new URLSearchParams(sp.toString());
          if (value) next.set(TOURNAMENT_FILTER_PARAM, value);
          else next.delete(TOURNAMENT_FILTER_PARAM);
          next.delete("page");
          const qs = next.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname);
        }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 min-w-[min(100%,220px)] max-w-md shadow-sm"
      >
        <option value="">Все турниры</option>
        {tournaments.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
