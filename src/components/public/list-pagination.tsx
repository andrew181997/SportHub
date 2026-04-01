import Link from "next/link";
import type { ListPaginationMeta } from "@/lib/pagination";
import { listPageHref } from "@/lib/pagination";

export function ListPagination({
  meta,
  query,
  className = "mt-8",
}: {
  meta: ListPaginationMeta;
  /** Параметры запроса, которые нужно сохранить при смене страницы (кроме `page`). */
  query?: Record<string, string | undefined>;
  className?: string;
}) {
  if (meta.totalPages <= 1) return null;

  const q = query ?? {};
  const prev = meta.page > 1 ? meta.page - 1 : null;
  const next = meta.page < meta.totalPages ? meta.page + 1 : null;

  return (
    <nav
      className={`flex flex-wrap items-center justify-between gap-4 text-sm ${className}`}
      aria-label="Постраничная навигация"
    >
      <p className="text-slate-600 tabular-nums">
        Показано{" "}
        <span className="font-medium text-slate-800">
          {meta.total === 0 ? 0 : meta.skip + 1}–{Math.min(meta.skip + meta.pageSize, meta.total)}
        </span>{" "}
        из <span className="font-medium text-slate-800">{meta.total}</span>
      </p>
      <div className="flex items-center gap-2">
        {prev != null ? (
          <Link
            href={listPageHref(prev, q)}
            className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            rel="prev"
          >
            Назад
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400">
            Назад
          </span>
        )}
        <span className="tabular-nums px-2 text-slate-700">
          {meta.page} / {meta.totalPages}
        </span>
        {next != null ? (
          <Link
            href={listPageHref(next, q)}
            className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            rel="next"
          >
            Вперёд
          </Link>
        ) : (
          <span className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400">
            Вперёд
          </span>
        )}
      </div>
    </nav>
  );
}
