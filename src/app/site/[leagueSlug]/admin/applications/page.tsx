import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/utils";

export default async function AdminApplicationsPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const applications = await prisma.application.findMany({
    where: { leagueId: league.id },
    orderBy: { createdAt: "desc" },
    include: { tournament: { select: { name: true } } },
  });

  const statusLabels: Record<string, string> = {
    PENDING: "Ожидает",
    APPROVED: "Одобрена",
    REJECTED: "Отклонена",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Заявки</h1>

      <div className="mt-6 rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Команда</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Контакт</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Турнир</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {applications.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{a.teamName}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {a.contactName} &middot; {a.contactEmail}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{a.tournament.name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[a.status]}`}>
                    {statusLabels[a.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(a.createdAt)}</td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Нет заявок
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
