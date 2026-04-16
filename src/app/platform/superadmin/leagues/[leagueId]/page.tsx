import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { SuperadminLeagueModeration } from "@/components/superadmin/moderation-buttons";

export default async function SuperadminLeagueDetailPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      siteConfig: true,
      plan: true,
      members: {
        where: { role: "ADMIN" },
        include: {
          user: { select: { id: true, email: true, name: true, status: true } },
        },
      },
      _count: {
        select: {
          teams: true,
          players: true,
          matches: true,
          tournaments: true,
          seasons: true,
          news: true,
          coaches: true,
          referees: true,
        },
      },
    },
  });

  if (!league) notFound();

  const publicUrl = `http://${league.slug}.sporthub.ru`;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/superadmin/leagues"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Все лиги
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{league.name}</h1>
          <p className="mt-1 text-sm text-gray-500 font-mono">{league.slug}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
              league.status === "ACTIVE"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {league.status === "ACTIVE" ? "Активна" : "Заблокирована"}
          </span>
          <SuperadminLeagueModeration leagueId={league.id} status={league.status} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Вид спорта
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{league.sportType}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Создана
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatDate(league.createdAt)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Публичный сайт
          </p>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-lg font-semibold text-blue-600 hover:underline"
          >
            Открыть →
          </a>
        </div>
      </div>

      {league.description ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Описание
          </p>
          <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
            {league.description}
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">Сводка</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {(
            [
              ["Сезонов", league._count.seasons],
              ["Турниров", league._count.tournaments],
              ["Команд", league._count.teams],
              ["Игроков", league._count.players],
              ["Матчей", league._count.matches],
              ["Новостей", league._count.news],
              ["Тренеров", league._count.coaches],
              ["Судей", league._count.referees],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center"
            >
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {league.plan ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Тариф / лимиты</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Команд (макс.)</dt>
              <dd className="font-medium text-slate-900">{league.plan.maxTeams}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Игроков (макс.)</dt>
              <dd className="font-medium text-slate-900">{league.plan.maxPlayers}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Турниров (макс.)</dt>
              <dd className="font-medium text-slate-900">{league.plan.maxTournaments}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Хранилище (МБ)</dt>
              <dd className="font-medium text-slate-900">{league.plan.maxStorageMb}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Администраторы лиги</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Имя</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Email</th>
              <th className="text-left px-4 py-2 font-medium text-slate-600">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {league.members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2 font-medium text-slate-900">{m.user.name}</td>
                <td className="px-4 py-2 text-slate-600">{m.user.email}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.user.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : m.user.status === "BLOCKED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {m.user.status}
                  </span>
                </td>
              </tr>
            ))}
            {league.members.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                  Нет администраторов
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
