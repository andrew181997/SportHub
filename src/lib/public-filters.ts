/** Query-параметр для фильтра списков портала лиги по турниру. */
export const TOURNAMENT_FILTER_PARAM = "tournament";

/** Поиск по спискам (команды, игроки). */
export const LIST_SEARCH_PARAM = "q";
export const LIST_SEARCH_MAX_LEN = 80;

export function parseTournamentFilterId(
  raw: string | string[] | undefined
): string | undefined {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (s == null || typeof s !== "string") return undefined;
  const t = s.trim();
  return t.length > 0 ? t : undefined;
}

export function parseListSearchQuery(
  raw: string | string[] | undefined
): string | undefined {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (s == null || typeof s !== "string") return undefined;
  const t = s.trim().slice(0, LIST_SEARCH_MAX_LEN);
  return t.length > 0 ? t : undefined;
}

/** Параметры пагинации: сохраняют турнир и поиск в URL. */
export function buildPortalListQuery(parts: {
  tournament?: string;
  q?: string;
}): Record<string, string | undefined> | undefined {
  const out: Record<string, string | undefined> = {};
  if (parts.tournament) out[TOURNAMENT_FILTER_PARAM] = parts.tournament;
  if (parts.q) out[LIST_SEARCH_PARAM] = parts.q;
  return Object.keys(out).length ? out : undefined;
}
