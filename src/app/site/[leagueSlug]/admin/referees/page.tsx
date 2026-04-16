import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RefereeAdminForm } from "@/components/admin/referee-admin-form";
import { DeleteRefereeButton } from "@/components/admin/delete-referee-button";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export const dynamic = "force-dynamic";

export default async function AdminRefereesPage({
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
  const total = await prisma.referee.count({ where: { leagueId: league.id } });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const referees = await prisma.referee.findMany({
    where: { leagueId: league.id },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    skip: meta.skip,
    take: meta.pageSize,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Судьи</h1>
      <p className="text-sm text-gray-600 mb-6 max-w-2xl">
        Судьи из этого списка можно назначать на матчи при заполнении протокола. Карточки отображаются на публичной странице «Судьи».
      </p>

      <div className="mb-10 max-w-xl">
        <RefereeAdminForm mode="create" />
      </div>

      <div className="rounded-xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Фамилия, имя</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Категория</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {referees.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/90">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {r.lastName} {r.firstName}
                </td>
                <td className="px-4 py-3 text-slate-600">{r.category ?? "—"}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link
                    href={`/admin/referees/${r.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Изменить
                  </Link>
                  <DeleteRefereeButton refereeId={r.id} />
                </td>
              </tr>
            ))}
            {referees.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  Пока нет судей — добавьте через форму выше.
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
