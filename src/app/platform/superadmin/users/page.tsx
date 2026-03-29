import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    where: { isSuperAdmin: false },
    orderBy: { createdAt: "desc" },
    include: {
      leagues: { include: { league: { select: { name: true, slug: true } } } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
      <p className="mt-1 text-sm text-gray-500">{users.length} пользователей</p>

      <div className="mt-6 rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Имя</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Лиги</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Регистрация</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-gray-500">{user.email}</td>
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
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {user.leagues.map((ul) => (
                    <span key={ul.id} className="inline-block mr-1 rounded bg-gray-100 px-1.5 py-0.5">
                      {ul.league.name} ({ul.role})
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
