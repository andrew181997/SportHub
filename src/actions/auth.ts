"use server";

import { createHash } from "crypto";
import { hash } from "bcrypt";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { sendVerificationCode, sendPasswordResetLink } from "@/lib/mail";
import { createVerificationCode, verifyCode } from "@/lib/otp";
import { createAuditLog } from "@/lib/audit";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

export async function register(formData: FormData) {
  const headersList = await headers();
  const ip = getRateLimitIdentifier(headersList);
  const rateLimit = checkRateLimit(ip, "register");
  if (!rateLimit.allowed) {
    logger.warn({ ip, action: "register" }, "Rate limit exceeded");
    return { error: "Слишком много попыток. Попробуйте позже." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }

  const { email, name, password, leagueName, slug, sportType } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "Пользователь с таким email уже существует" };
  }

  const existingSlug = await prisma.league.findUnique({ where: { slug } });
  if (existingSlug) {
    return { error: "Этот адрес уже занят" };
  }

  const passwordHash = await hash(password, 12);

  const user = await prisma.user.create({
    data: { email, name, passwordHash, status: "PENDING" },
  });

  const league = await prisma.league.create({
    data: {
      name: leagueName,
      slug,
      sportType,
      siteConfig: { create: {} },
      plan: { create: {} },
    },
  });

  await prisma.userLeague.create({
    data: { userId: user.id, leagueId: league.id, role: "ADMIN" },
  });

  const code = await createVerificationCode(email, "REGISTRATION");
  await sendVerificationCode(email, code);

  return { success: true, email };
}

export async function verifyOtp(formData: FormData) {
  const headersList = await headers();
  const ip = getRateLimitIdentifier(headersList);
  const rateLimit = checkRateLimit(ip, "otp");
  if (!rateLimit.allowed) {
    logger.warn({ ip, action: "verifyOtp" }, "Rate limit exceeded");
    return { error: "Слишком много попыток. Подождите минуту." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = verifyOtpSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Некорректный код" };
  }

  const { email, code } = parsed.data;
  const isValid = await verifyCode(email, code, "REGISTRATION");

  if (!isValid) {
    return { error: "Неверный или просроченный код" };
  }

  const user = await prisma.user.update({
    where: { email },
    data: { status: "ACTIVE" },
  });

  await createAuditLog({
    action: "USER_REGISTERED",
    userId: user.id,
    userEmail: email,
  });

  const membership = await prisma.userLeague.findFirst({
    where: { userId: user.id },
    include: { league: { select: { slug: true } } },
  });

  try {
    await signIn("credentials", {
      email,
      password: raw.password as string,
      redirect: false,
    });
  } catch {
    // Sign-in after registration; if it fails the user can log in manually
  }

  return {
    success: true,
    leagueSlug: membership?.league.slug ?? null,
  };
}

export async function resendOtp(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "PENDING") {
    return { error: "Пользователь не найден" };
  }

  const code = await createVerificationCode(email, "REGISTRATION");
  await sendVerificationCode(email, code);

  return { success: true };
}

export async function login(formData: FormData) {
  const headersList = await headers();
  const ip = getRateLimitIdentifier(headersList);
  const rateLimit = checkRateLimit(ip, "login");
  if (!rateLimit.allowed) {
    logger.warn({ ip, action: "login" }, "Rate limit exceeded");
    return { error: "Слишком много попыток входа. Подождите минуту." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Введите email и пароль" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Неверный email или пароль" };
    }
    throw error;
  }
}

export async function forgotPassword(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = forgotPasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Введите корректный email" };
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) return { success: true };

  const token = await createVerificationCode(email, "PASSWORD_RESET");
  await sendPasswordResetLink(email, token);

  return { success: true };
}

export async function resetPassword(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = resetPasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Ошибка валидации" };
  }

  const { token, password } = parsed.data;

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const record = await prisma.verificationCode.findFirst({
    where: {
      codeHash: tokenHash,
      type: "PASSWORD_RESET",
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    return { error: "Ссылка недействительна или просрочена" };
  }

  const passwordHash = await hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { passwordHash, failedAttempts: 0, lockedUntil: null },
    }),
    prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    }),
  ]);

  return { success: true };
}

export async function checkSlugAvailability(slug: string) {
  const existing = await prisma.league.findUnique({ where: { slug } });
  return { available: !existing };
}
