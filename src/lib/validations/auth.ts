import { z } from "zod/v4";

export const registerSchema = z.object({
  email: z.email("Введите корректный email"),
  name: z.string().min(2, "Минимум 2 символа").max(100, "Максимум 100 символов"),
  password: z
    .string()
    .min(8, "Минимум 8 символов")
    .max(72, "Максимум 72 символа")
    .regex(/[A-ZА-Я]/, "Нужна хотя бы одна заглавная буква")
    .regex(/[0-9]/, "Нужна хотя бы одна цифра"),
  leagueName: z.string().min(2, "Минимум 2 символа").max(100),
  slug: z
    .string()
    .min(3, "Минимум 3 символа")
    .max(50, "Максимум 50 символов")
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  sportType: z.enum(["HOCKEY", "FOOTBALL", "BASKETBALL", "VOLLEYBALL", "OTHER"]),
});

export const loginSchema = z.object({
  email: z.email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const verifyOtpSchema = z.object({
  email: z.email(),
  code: z.string().length(6, "Код должен содержать 6 цифр"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Введите корректный email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Минимум 8 символов")
    .max(72, "Максимум 72 символа"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
