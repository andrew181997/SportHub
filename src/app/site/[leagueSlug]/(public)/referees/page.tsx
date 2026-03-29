import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function RefereesPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
  });

  if (!league) notFound();

  const referees = await prisma.referee.findMany({
    where: { leagueId: league.id },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Судьи</h1>

      {referees.length === 0 ? (
        <p className="text-gray-500">Информация о судьях пока не добавлена.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {referees.map((referee) => (
            <div
              key={referee.id}
              className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                {referee.photo ? (
                  <img
                    src={referee.photo}
                    alt={`${referee.firstName} ${referee.lastName}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl font-bold">
                    {referee.firstName[0]}{referee.lastName[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {referee.lastName} {referee.firstName}
                  </p>
                  {referee.category && (
                    <p className="text-sm text-gray-500">
                      Категория: {referee.category}
                    </p>
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
