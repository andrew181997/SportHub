import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const sportLabels: Record<string, string> = {
    HOCKEY: "Хоккей",
    FOOTBALL: "Футбол",
    BASKETBALL: "Баскетбол",
    VOLLEYBALL: "Волейбол",
    OTHER: "Другой вид спорта",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">О лиге</h1>

      <div className="mt-6 rounded-xl border bg-white p-8">
        <h2 className="text-xl font-bold text-gray-900">{league.name}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {sportLabels[league.sportType]}
        </p>

        {league.description ? (
          <div className="mt-6 prose prose-gray">
            <p>{league.description}</p>
          </div>
        ) : (
          <p className="mt-6 text-gray-400">Описание отсутствует</p>
        )}
      </div>
    </div>
  );
}
