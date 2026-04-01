import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageRaw } = await searchParams;
  const page = parseListPage(pageRaw);
  const total = await prisma.auditLog.count();
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    skip: meta.skip,
    take: meta.pageSize,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Журнал действий</h1>

      <div className="mt-6 rounded-xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Дата</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Действие</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Пользователь</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Цель</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/90">
                <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-mono">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{log.userEmail}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {log.targetType && `${log.targetType}:${log.targetId?.slice(0, 8)}`}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs font-mono">{log.ipAddress}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Нет записей
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ListPagination meta={meta} className="mt-6" />
    </div>
  );
}
