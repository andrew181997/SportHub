import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RefereeAdminForm } from "@/components/admin/referee-admin-form";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminRefereeEditPage({
  params,
}: {
  params: Promise<{ leagueSlug: string; refereeId: string }>;
}) {
  const { leagueSlug, refereeId } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const referee = await prisma.referee.findFirst({
    where: { id: refereeId, leagueId: league.id },
  });
  if (!referee) notFound();

  return (
    <div>
      <Link
        href="/admin/referees"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        К списку судей
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Судья: {referee.lastName} {referee.firstName}
      </h1>
      <div className="max-w-xl">
        <RefereeAdminForm
          mode="edit"
          refereeId={referee.id}
          initial={{
            firstName: referee.firstName,
            lastName: referee.lastName,
            photo: referee.photo,
            category: referee.category,
          }}
        />
      </div>
    </div>
  );
}
