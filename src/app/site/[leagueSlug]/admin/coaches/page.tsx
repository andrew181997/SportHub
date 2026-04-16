import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CoachAdminForm } from "@/components/admin/coach-admin-form";
import { DeleteCoachButton } from "@/components/admin/delete-coach-button";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export const dynamic = "force-dynamic";

export default async function AdminCoachesPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  noStore();
  const { leagueSlug } = await params;
  const { page: pageRaw } = await searchParams;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const page = parseListPage(pageRaw);
  const total = await prisma.coach.count({ where: { leagueId: league.id } });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const [coaches, teams] = await Promise.all([
    prisma.coach.findMany({
      where: { leagueId: league.id },
      include: { team: { select: { name: true } } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: meta.skip,
      take: meta.pageSize,
    }),
    prisma.team.findMany({
      where: { leagueId: league.id, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Тренеры</h1>
      <p className="text-sm text-gray-600 mb-6 max-w-2xl">
        Тренеры отображаются на публичной странице «Тренеры». Можно привязать тренера к команде или оставить без команды.
      </p>

      <div className="mb-10 max-w-xl">
        <CoachAdminForm mode="create" teams={teams} />
      </div>

      <div className="rounded-xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Фамилия, имя</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Команда</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {coaches.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/90">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {c.lastName} {c.firstName}
                </td>
                <td className="px-4 py-3 text-slate-600">{c.team?.name ?? "—"}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link
                    href={`/admin/coaches/${c.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Изменить
                  </Link>
                  <DeleteCoachButton coachId={c.id} />
                </td>
              </tr>
            ))}
            {coaches.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  Пока нет тренеров — добавьте через форму выше.
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
