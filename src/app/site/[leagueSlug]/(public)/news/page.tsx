import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDateLong } from "@/lib/utils";
import { ListPagination } from "@/components/public/list-pagination";
import {
  computeListPagination,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from "@/lib/pagination";

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { leagueSlug } = await params;
  const { page: pageRaw } = await searchParams;
  const league = await prisma.league.findUnique({ where: { slug: leagueSlug } });
  if (!league) notFound();

  const page = parseListPage(pageRaw);
  const where = { leagueId: league.id, hidden: false, publishedAt: { not: null } };
  const total = await prisma.news.count({ where });
  const meta = computeListPagination(page, DEFAULT_LIST_PAGE_SIZE, total);

  const articles = await prisma.news.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    skip: meta.skip,
    take: meta.pageSize,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Новости</h1>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="surface-entity-card overflow-hidden hover:shadow-lg transition-shadow"
          >
            {article.coverImage && (
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-48 object-cover border-b border-slate-200"
              />
            )}
            <div className="p-5">
              <h3 className="font-semibold text-slate-900 line-clamp-2">
                {article.title}
              </h3>
              {article.tags.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {article.publishedAt && (
                <p className="mt-3 text-xs text-slate-500">
                  {formatDateLong(article.publishedAt)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <ListPagination meta={meta} />

      {articles.length === 0 && (
        <p className="mt-8 text-slate-500">Нет новостей</p>
      )}
    </div>
  );
}
