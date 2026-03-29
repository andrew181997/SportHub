import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Журнал действий</h1>

      <div className="mt-6 rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Дата</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Действие</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Пользователь</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Цель</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{log.userEmail}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {log.targetType && `${log.targetType}:${log.targetId?.slice(0, 8)}`}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">{log.ipAddress}</td>
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
    </div>
  );
}
