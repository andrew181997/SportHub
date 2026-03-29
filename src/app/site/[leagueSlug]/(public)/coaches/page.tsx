import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function CoachesPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
  });

  if (!league) notFound();

  const coaches = await prisma.coach.findMany({
    where: { leagueId: league.id },
    include: { team: { select: { name: true, logo: true } } },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Тренеры</h1>

      {coaches.length === 0 ? (
        <p className="text-gray-500">Информация о тренерах пока не добавлена.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map((coach) => (
            <div
              key={coach.id}
              className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                {coach.photo ? (
                  <img
                    src={coach.photo}
                    alt={`${coach.firstName} ${coach.lastName}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl font-bold">
                    {coach.firstName[0]}{coach.lastName[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {coach.lastName} {coach.firstName}
                  </p>
                  {coach.team && (
                    <p className="text-sm text-gray-500">{coach.team.name}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
