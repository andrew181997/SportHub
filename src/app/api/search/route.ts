import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/lib/search";
import { prisma } from "@/lib/prisma";
import { extractSubdomain } from "@/lib/tenant";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Заголовки, чтобы браузер/прокси/CDN не отдавали 304 с пустым телом. */
const SEARCH_RESPONSE_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  Vary: "*",
};

function jsonNoStore(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
  return NextResponse.json(body, {
    status: init?.status,
    headers: { ...SEARCH_RESPONSE_HEADERS, ...init?.headers },
  });
}

export async function GET(request: NextRequest) {
  const ip = getRateLimitIdentifier(request.headers);
  const rateLimit = checkRateLimit(ip, "search");
  if (!rateLimit.allowed) {
    return jsonNoStore(
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
    return jsonNoStore({ players: [], teams: [], news: [] });
  }

  const league = await prisma.league.findUnique({
    where: { slug: subdomain },
  });

  if (!league) {
    return jsonNoStore({ players: [], teams: [], news: [] });
  }

  const results = await globalSearch(league.id, query);

  const body = {
    players: results.players.map((p) => ({
      id: p.id,
      name: [p.lastName, p.firstName, p.middleName].filter(Boolean).join(" "),
    })),
    teams: results.teams.map((t) => ({ id: t.id, name: t.name })),
    news: results.news.map((n) => ({
      id: n.id,
      title: n.title,
      slug: n.slug,
    })),
  };

  return jsonNoStore(body);
}
