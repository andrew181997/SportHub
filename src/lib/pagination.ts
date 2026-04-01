/** Размер страницы по умолчанию для списков в публичной части и админке. */
export const DEFAULT_LIST_PAGE_SIZE = 20;

export function parseListPage(
  raw: string | string[] | undefined
): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(s ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export type ListPaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  skip: number;
};

export function computeListPagination(
  page: number,
  pageSize: number,
  total: number
): ListPaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    skip: (safePage - 1) * pageSize,
  };
}

/** Собирает query-string для пагинации; при page=1 параметр `page` опускается. */
export function listPageHref(
  page: number,
  base: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(base)) {
    if (value !== undefined && value !== "") params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
