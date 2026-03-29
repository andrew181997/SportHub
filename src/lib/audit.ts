import { prisma } from "./prisma";
import { headers } from "next/headers";

interface AuditLogEntry {
  action: string;
  userId: string;
  userEmail: string;
  leagueId?: string;
  targetType?: string;
  targetId?: string;
  details?: object;
}

export async function createAuditLog(entry: AuditLogEntry) {
  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  await prisma.auditLog.create({
    data: {
      ...entry,
      ipAddress,
    },
  });
}
