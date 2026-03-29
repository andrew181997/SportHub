import { PlayerRole } from "@prisma/client";

const INVISIBLE = /[\u200B-\u200D\uFEFF]/g;

/** Нормализация значения амплуа из формы (пробелы, zero-width) → значение Prisma. */
export function normalizePlayerRole(raw: unknown): PlayerRole | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(INVISIBLE, "").trim();
  if (!cleaned) return null;
  const values = Object.values(PlayerRole) as string[];
  if (!values.includes(cleaned)) return null;
  return cleaned as PlayerRole;
}
