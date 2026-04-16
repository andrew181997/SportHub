import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TeamEditForm } from "@/components/admin/team-edit-form";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTeamEditPage({
  params,
}: {
  params: Promise<{ leagueSlug: string; teamId: string }>;
}) {
  const { leagueSlug, teamId } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const team = await prisma.team.findFirst({
    where: { id: teamId, leagueId: league.id },
  });
  if (!team) notFound();

  return (
    <div>
      <Link
        href="/admin/teams"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        К списку команд
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Редактирование: {team.name}</h1>
      <TeamEditForm team={team} />
    </div>
  );
}
