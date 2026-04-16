export type LeagueThemeId = "default" | "dark" | "sport";

export type PublicHeaderSearchVariant = "light" | "dark" | "sport";

/** Классы оболочки публичного сайта лиги по выбранной теме. */
export function getLeaguePublicShell(theme: string | null | undefined) {
  const t = (theme ?? "default") as LeagueThemeId;

  if (t === "dark") {
    return {
      root: "min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased",
      header:
        "border-b border-slate-700/80 bg-slate-900/95 backdrop-blur-md shadow-lg shadow-black/20 sticky top-0 z-50",
      main: "flex-1 text-slate-100 league-public-main league-main-dark",
      footer:
        "border-t border-slate-800/90 bg-slate-900/80 backdrop-blur-sm text-slate-400",
      navLink:
        "px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/90 transition-all duration-200",
      useGradientHeader: false as const,
      searchVariant: "dark" as PublicHeaderSearchVariant,
    };
  }

  if (t === "sport") {
    return {
      root: "min-h-screen flex flex-col antialiased",
      header:
        "border-b border-white/10 shadow-lg shadow-black/15 sticky top-0 z-50",
      main: "flex-1 text-slate-900 league-public-main league-main-sport",
      footer:
        "border-t border-slate-200/90 bg-white/95 backdrop-blur-sm text-slate-600 shadow-[0_-4px_24px_-8px_rgba(15,23,42,0.08)]",
      navLink:
        "px-3 py-2 text-sm font-medium text-white/90 hover:text-white rounded-lg hover:bg-white/15 transition-all duration-200",
      useGradientHeader: true as const,
      searchVariant: "sport" as PublicHeaderSearchVariant,
    };
  }

  return {
    root: "min-h-screen flex flex-col antialiased",
    header:
      "border-b border-slate-200/70 bg-white/90 backdrop-blur-md shadow-sm shadow-slate-900/5 sticky top-0 z-50",
    main: "flex-1 text-slate-900 league-public-main league-main-default",
    footer:
      "border-t border-slate-200/80 bg-gradient-to-b from-slate-50 to-slate-100/95 text-slate-600",
    navLink:
      "px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100/90 transition-all duration-200",
    useGradientHeader: false as const,
    searchVariant: "light" as PublicHeaderSearchVariant,
  };
}
