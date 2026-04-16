"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isSuperAdmin: true, status: true },
  });
  if (
    !actor?.isSuperAdmin ||
    actor.status !== "ACTIVE"
  ) {
    throw new Error("Forbidden");
  }
  return actor;
}

export async function superadminBlockUser(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Missing userId");
  const actor = await requireSuperAdmin();

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isSuperAdmin: true, email: true },
  });
  if (!target || target.isSuperAdmin) {
    throw new Error("Cannot block this user");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "BLOCKED" },
  });

  await createAuditLog({
    action: "SUPERADMIN_USER_BLOCK",
    userId: actor.id,
    userEmail: actor.email,
    targetType: "User",
    targetId: userId,
    details: { email: target.email },
  });

  revalidatePath("/superadmin/users");
  revalidatePath("/superadmin/dashboard");
}

export async function superadminUnblockUser(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Missing userId");
  const actor = await requireSuperAdmin();

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isSuperAdmin: true, email: true },
  });
  if (!target || target.isSuperAdmin) {
    throw new Error("Cannot unblock this user");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
  });

  await createAuditLog({
    action: "SUPERADMIN_USER_UNBLOCK",
    userId: actor.id,
    userEmail: actor.email,
    targetType: "User",
    targetId: userId,
    details: { email: target.email },
  });

  revalidatePath("/superadmin/users");
  revalidatePath("/superadmin/dashboard");
}

export async function superadminBlockLeague(formData: FormData) {
  const leagueId = String(formData.get("leagueId") ?? "");
  if (!leagueId) throw new Error("Missing leagueId");
  const actor = await requireSuperAdmin();

  const league = await prisma.league.update({
    where: { id: leagueId },
    data: { status: "BLOCKED" },
    select: { id: true, name: true, slug: true },
  });

  await createAuditLog({
    action: "SUPERADMIN_LEAGUE_BLOCK",
    userId: actor.id,
    userEmail: actor.email,
    leagueId: league.id,
    targetType: "League",
    targetId: league.id,
    details: { name: league.name, slug: league.slug },
  });

  revalidatePath("/superadmin/leagues");
  revalidatePath(`/superadmin/leagues/${leagueId}`);
  revalidatePath("/superadmin/dashboard");
}

export async function superadminUnblockLeague(formData: FormData) {
  const leagueId = String(formData.get("leagueId") ?? "");
  if (!leagueId) throw new Error("Missing leagueId");
  const actor = await requireSuperAdmin();

  const league = await prisma.league.update({
    where: { id: leagueId },
    data: { status: "ACTIVE" },
    select: { id: true, name: true, slug: true },
  });

  await createAuditLog({
    action: "SUPERADMIN_LEAGUE_UNBLOCK",
    userId: actor.id,
    userEmail: actor.email,
    leagueId: league.id,
    targetType: "League",
    targetId: league.id,
    details: { name: league.name, slug: league.slug },
  });

  revalidatePath("/superadmin/leagues");
  revalidatePath(`/superadmin/leagues/${leagueId}`);
  revalidatePath("/superadmin/dashboard");
}
