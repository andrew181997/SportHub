import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CoachAdminForm } from "@/components/admin/coach-admin-form";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCoachEditPage({
  params,
}: {
  params: Promise<{ leagueSlug: string; coachId: string }>;
}) {
  const { leagueSlug, coachId } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const [coach, teams] = await Promise.all([
    prisma.coach.findFirst({
      where: { id: coachId, leagueId: league.id },
    }),
    prisma.team.findMany({
      where: { leagueId: league.id, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!coach) notFound();

  return (
    <div>
      <Link
        href="/admin/coaches"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        К списку тренеров
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Тренер: {coach.lastName} {coach.firstName}
      </h1>
      <div className="max-w-xl">
        <CoachAdminForm
          mode="edit"
          coachId={coach.id}
          teams={teams}
          initial={{
            firstName: coach.firstName,
            lastName: coach.lastName,
            photo: coach.photo,
            teamId: coach.teamId,
          }}
        />
      </div>
    </div>
  );
}
