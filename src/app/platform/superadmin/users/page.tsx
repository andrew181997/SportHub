import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ListPagination } from "@/components/public/list-pagination";
import { SuperadminUserModeration } from "@/components/superadmin/moderation-buttons";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageRaw } = await searchParams;
  const page = parseListPage(pageRaw);
  const where = { isSuperAdmin: false };
  const total = await prisma.user.count({ where });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: meta.skip,
    take: meta.pageSize,
    include: {
      leagues: { include: { league: { select: { name: true, slug: true } } } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
      <p className="mt-1 text-sm text-gray-500">{total} пользователей</p>

      <div className="mt-6 rounded-xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Имя</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Лиги</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Регистрация</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/90">
                <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : user.status === "BLOCKED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {user.leagues.map((ul) => (
                    <span key={ul.id} className="inline-block mr-1 rounded bg-slate-100 px-1.5 py-0.5">
                      {ul.league.name} ({ul.role})
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <SuperadminUserModeration userId={user.id} status={user.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ListPagination meta={meta} className="mt-6" />
    </div>
  );
}
