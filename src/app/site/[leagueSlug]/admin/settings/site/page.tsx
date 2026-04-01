import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SiteSettingsClient } from "@/components/admin/site-settings-client";

export default async function SiteSettingsPage({
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

  const c = league.siteConfig;

  return (
    <SiteSettingsClient
      initial={{
        theme: c?.theme ?? "default",
        primaryColor: c?.primaryColor ?? "#1d4ed8",
        secondaryColor: c?.secondaryColor ?? "#9333ea",
        footerText: c?.footerText ?? "",
        leagueName: league.name,
        description: league.description ?? "",
        logoUrl: league.logo,
      }}
    />
  );
}
