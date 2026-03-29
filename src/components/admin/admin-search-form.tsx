import Link from "next/link";

type HiddenField = { name: string; value: string };

export function AdminSearchForm({
  placeholder,
  defaultQuery = "",
  hiddenFields = [],
  resetHref,
}: {
  placeholder: string;
  defaultQuery?: string;
  hiddenFields?: HiddenField[];
  /** URL без параметра q (например `/admin/players` или `?team=id`) */
  resetHref?: string;
}) {
  return (
    <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
      {hiddenFields.map((h) => (
        <input key={h.name} type="hidden" name={h.name} value={h.value} />
      ))}
      <div className="flex-1 min-w-[200px] max-w-md">
        <label htmlFor="admin-search-q" className="block text-sm font-medium text-gray-700 mb-1">
          Поиск
        </label>
        <input
          id="admin-search-q"
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center gap-2 pb-0.5">
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Найти
        </button>
        {defaultQuery && resetHref ? (
          <Link href={resetHref} className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap">
            Сбросить
          </Link>
        ) : null}
      </div>
    </form>
  );
}
