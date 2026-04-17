import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { HomeSectionsEditor } from "@/components/admin/home-sections-editor";
import { parseHomeSectionsFromDb } from "@/lib/home-sections";

export default async function SectionsSettingsPage({
  params,
}: {
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    include: { siteConfig: true },
  });
  if (!league) notFound();

  const initial = parseHomeSectionsFromDb(league.siteConfig?.sections);

  return <HomeSectionsEditor initial={initial} />;
}
