export type LeagueThemeId = "default" | "dark" | "sport";

export type PublicHeaderSearchVariant = "light" | "dark" | "sport";

/** Классы оболочки публичного сайта лиги по выбранной теме. */
export function getLeaguePublicShell(theme: string | null | undefined) {
  const t = (theme ?? "default") as LeagueThemeId;

  if (t === "dark") {
    return {
      root: "min-h-screen flex flex-col bg-slate-950 text-slate-100",
      header:
        "border-b border-slate-700 bg-slate-900 shadow-md shadow-black/25 sticky top-0 z-50",
      main: "flex-1 bg-slate-950 text-slate-100",
      footer: "border-t border-slate-800 bg-slate-900 text-slate-400",
      navLink:
        "px-3 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors",
      useGradientHeader: false as const,
      searchVariant: "dark" as PublicHeaderSearchVariant,
    };
  }

  if (t === "sport") {
    return {
      root: "min-h-screen flex flex-col",
      header: "border-b border-transparent shadow-md sticky top-0 z-50",
      main: "flex-1 bg-slate-200/60 text-slate-900",
      footer: "border-t border-slate-300/80 bg-white text-slate-600",
      navLink:
        "px-3 py-2 text-sm text-white/90 hover:text-white rounded-lg hover:bg-white/15 transition-colors",
      useGradientHeader: true as const,
      searchVariant: "sport" as PublicHeaderSearchVariant,
    };
  }

  return {
    root: "min-h-screen flex flex-col",
    header: "border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50",
    main: "flex-1 bg-slate-200/60 text-slate-900",
    footer: "border-t border-slate-300/80 bg-slate-100 text-slate-600",
    navLink:
      "px-3 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors",
    useGradientHeader: false as const,
    searchVariant: "light" as PublicHeaderSearchVariant,
  };
}
