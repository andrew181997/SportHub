import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/lib/search";
import { prisma } from "@/lib/prisma";
import { extractSubdomain } from "@/lib/tenant";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getRateLimitIdentifier(request.headers);
  const rateLimit = checkRateLimit(ip, "search");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  const query = request.nextUrl.searchParams.get("q");
  const host = request.headers.get("host") ?? "";
  const subdomain = extractSubdomain(host);

  if (!query || !subdomain) {
    return NextResponse.json({ players: [], teams: [], news: [] });
  }

  const league = await prisma.league.findUnique({
    where: { slug: subdomain },
  });

  if (!league) {
    return NextResponse.json({ players: [], teams: [], news: [] });
  }

  const results = await globalSearch(league.id, query);
  return NextResponse.json(results);
}
