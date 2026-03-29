import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDateLong } from "@/lib/utils";

export default async function NewsPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const articles = await prisma.news.findMany({
    where: { leagueId: league.id, hidden: false, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Новости</h1>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="rounded-xl border bg-white overflow-hidden hover:shadow-md transition-shadow"
          >
            {article.coverImage && (
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-5">
              <h3 className="font-semibold text-gray-900 line-clamp-2">
                {article.title}
              </h3>
              {article.tags.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {article.publishedAt && (
                <p className="mt-3 text-xs text-gray-400">
                  {formatDateLong(article.publishedAt)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {articles.length === 0 && (
        <p className="mt-8 text-gray-400">Нет новостей</p>
      )}
    </div>
  );
}
