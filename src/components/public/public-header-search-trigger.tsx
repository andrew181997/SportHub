"use client";

import { Search } from "lucide-react";
import type { PublicHeaderSearchVariant } from "@/lib/league-theme";

const variantClass: Record<PublicHeaderSearchVariant, string> = {
  light:
    "p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors",
  dark:
    "p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors",
  sport:
    "p-2 text-white/75 hover:text-white rounded-lg hover:bg-white/15 transition-colors",
};

export function PublicHeaderSearchTrigger({
  variant = "light",
}: {
  variant?: PublicHeaderSearchVariant;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("sporthub:open-search"))}
      className={variantClass[variant]}
      aria-label="Открыть поиск"
    >
      <Search className="w-5 h-5" />
    </button>
  );
}
