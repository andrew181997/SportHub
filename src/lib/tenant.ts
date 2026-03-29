import { headers } from "next/headers";
import { prisma } from "./prisma";
import { cache } from "react";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "sporthub.ru";

export function extractSubdomain(hostname: string): string | null {
  const localhostMatch = hostname.match(/^(.+)\.localhost/);
  if (localhostMatch) return localhostMatch[1];

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    return hostname.replace(`.${ROOT_DOMAIN}`, "");
  }

  return null;
}

export const getLeagueBySlug = cache(async (slug: string) => {
  return prisma.league.findUnique({
    where: { slug },
    include: { siteConfig: true, plan: true },
  });
});

export async function getLeagueContext() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const subdomain = extractSubdomain(host);

  if (!subdomain || subdomain === "www") return null;

  return getLeagueBySlug(subdomain);
}

export async function requireLeagueContext() {
  const league = await getLeagueContext();
  if (!league) {
    throw new Error("League not found");
  }
  return league;
}
