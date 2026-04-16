"use server";

import { auth } from "@/lib/auth";
import { getLeagueContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

/**
 * После credentials signIn проверяет, что сессия видит пользователя с UserLeague для текущего поддомена.
 * Иначе админ-лейаут отдаст 307 на no_access — лучше сразу выйти и показать форму.
 */
export async function assertLeagueAdminMembershipAfterLogin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, reason: "no_session" as const };
  }

  const league = await getLeagueContext();
  if (!league) {
    return { ok: false as const, reason: "no_league" as const };
  }

  if (league.status === "BLOCKED") {
    return { ok: false as const, reason: "league_blocked" as const };
  }

  const membership = await prisma.userLeague.findUnique({
    where: {
      userId_leagueId: {
        userId: session.user.id,
        leagueId: league.id,
      },
    },
  });

  if (!membership) {
    return { ok: false as const, reason: "no_membership" as const };
  }

  return { ok: true as const };
}
