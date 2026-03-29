import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDateLong } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ leagueSlug: string; slug: string }>;
}) {
  const { leagueSlug, slug } = await params;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const article = await prisma.news.findUnique({
    where: { leagueId_slug: { leagueId: league.id, slug } },
  });

  if (!article || article.hidden) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/news"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Все новости
      </Link>

      {article.coverImage && (
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-64 sm:h-80 object-cover rounded-xl mb-6"
        />
      )}

      <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>

      <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
        {article.publishedAt && (
          <time>{formatDateLong(article.publishedAt)}</time>
        )}
        {article.tags.length > 0 && (
          <div className="flex gap-1">
            {article.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <article
        className="mt-8 prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </div>
  );
}
