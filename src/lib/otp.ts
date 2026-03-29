import { createHash, randomBytes, randomInt } from "crypto";
import { prisma } from "./prisma";

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function generateOTP(): string {
  return randomInt(100000, 999999).toString();
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createVerificationCode(
  email: string,
  type: "REGISTRATION" | "PASSWORD_RESET"
): Promise<string> {
  const code =
    type === "REGISTRATION" ? generateOTP() : generateResetToken();
  const ttlMinutes = type === "REGISTRATION" ? 10 : 30;

  await prisma.verificationCode.updateMany({
    where: { email, type, used: false },
    data: { used: true },
  });

  await prisma.verificationCode.create({
    data: {
      email,
      codeHash: hashCode(code),
      type,
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    },
  });

  return code;
}

export async function verifyCode(
  email: string,
  code: string,
  type: "REGISTRATION" | "PASSWORD_RESET"
): Promise<boolean> {
  const record = await prisma.verificationCode.findFirst({
    where: {
      email,
      type,
      codeHash: hashCode(code),
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) return false;

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true },
  });

  return true;
}
