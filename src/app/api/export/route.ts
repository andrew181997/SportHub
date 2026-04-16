import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractSubdomain } from "@/lib/tenant";
import {
  exportTeamsCsv,
  exportPlayersCsv,
  exportMatchesCsv,
  exportStandingsCsv,
} from "@/lib/export";

const EXPORTERS: Record<string, (leagueId: string) => Promise<string>> = {
  teams: exportTeamsCsv,
  players: exportPlayersCsv,
  matches: exportMatchesCsv,
  standings: exportStandingsCsv,
};

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const host = request.headers.get("host") ?? "";
  const subdomain = extractSubdomain(host);
  if (!subdomain) {
    return NextResponse.json({ error: "No league context" }, { status: 400 });
  }

  const league = await prisma.league.findUnique({
    where: { slug: subdomain },
  });
  if (!league) {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }
  if (league.status === "BLOCKED") {
    return NextResponse.json({ error: "League unavailable" }, { status: 403 });
  }

  const membership = await prisma.userLeague.findUnique({
    where: {
      userId_leagueId: { userId: session.user.id!, leagueId: league.id },
    },
  });
  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type");
  const exporter = type ? EXPORTERS[type] : undefined;

  if (!exporter) {
    return NextResponse.json(
      { error: "Invalid type. Use: teams, players, matches, standings" },
      { status: 400 }
    );
  }

  const csv = await exporter(league.id);
  const bom = "\uFEFF";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}_${league.slug}_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
