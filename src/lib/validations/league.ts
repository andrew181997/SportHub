import { PlayerRole } from "@prisma/client";
import { z } from "zod/v4";

const playoffPairingEnum = z.enum([
  "SEEDING_1_8",
  "SEEDING_ADJACENT",
  "MANUAL",
]);

export const tournamentSchema = z
  .object({
    name: z.string().min(2, "Минимум 2 символа").max(100),
    emblem: z
      .string()
      .max(500)
      .optional()
      .transform((s) => (s == null || s.trim() === "" ? undefined : s.trim())),
    type: z.enum(["REGULAR", "PLAYOFF", "GROUP_STAGE", "CUP"]),
    playoffPairing: z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      playoffPairingEnum.optional()
    ),
    seriesWinsToWin: z.preprocess(
      (v) =>
        v === "" || v == null ? undefined : Number(v),
      z.number().int().min(1).max(4).optional()
    ),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PLAYOFF") {
      if (!data.playoffPairing) {
        ctx.addIssue({
          code: "custom",
          message: "Выберите систему формирования пар",
          path: ["playoffPairing"],
        });
      }
      if (data.seriesWinsToWin == null || Number.isNaN(data.seriesWinsToWin)) {
        ctx.addIssue({
          code: "custom",
          message: "Укажите побед в серии до завершения (1–4)",
          path: ["seriesWinsToWin"],
        });
      }
    }
  });

export const teamSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа").max(100),
  city: z.string().max(100).optional(),
  foundedYear: z.coerce.number().min(1800).max(2100).optional(),
  description: z.string().max(5000).optional(),
  contactEmail: z.email().optional().or(z.literal("")),
  logo: z
    .string()
    .max(500)
    .optional()
    .transform((s) => (s == null || s.trim() === "" ? undefined : s.trim())),
});

export const refereeSchema = z.object({
  firstName: z
    .string()
    .min(1, "Введите имя")
    .max(100)
    .transform((s) => s.trim()),
  lastName: z
    .string()
    .min(1, "Введите фамилию")
    .max(100)
    .transform((s) => s.trim()),
  photo: z
    .string()
    .max(500)
    .optional()
    .transform((s) => (s == null || s.trim() === "" ? undefined : s.trim())),
  category: z
    .string()
    .max(100)
    .optional()
    .transform((s) => (s == null || s.trim() === "" ? undefined : s.trim())),
});

export const coachSchema = z.object({
  firstName: z
    .string()
    .min(1, "Введите имя")
    .max(100)
    .transform((s) => s.trim()),
  lastName: z
    .string()
    .min(1, "Введите фамилию")
    .max(100)
    .transform((s) => s.trim()),
  photo: z
    .string()
    .max(500)
    .optional()
    .transform((s) => (s == null || s.trim() === "" ? undefined : s.trim())),
  teamId: z
    .string()
    .optional()
    .transform((s) => (s == null || s.trim() === "" ? undefined : s.trim())),
});

export const playerSchema = z.object({
  firstName: z
    .string()
    .min(1, "Введите имя")
    .max(100)
    .transform((s) => s.trim()),
  lastName: z
    .string()
    .min(1, "Введите фамилию")
    .max(100)
    .transform((s) => s.trim()),
  middleName: z.string().max(100).optional().or(z.literal("")),
  birthDate: z.coerce.date().optional(),
  role: z.nativeEnum(PlayerRole).default(PlayerRole.FORWARD),
});

export const matchSchema = z.object({
  datetime: z.coerce.date(),
  homeTeamId: z.string().min(1, "Выберите команду хозяев"),
  awayTeamId: z.string().min(1, "Выберите команду гостей"),
  tournamentId: z.string().min(1, "Выберите турнир"),
  groupId: z.string().optional(),
  venue: z.string().max(200).optional(),
  round: z.coerce.number().positive().optional(),
});

/** Создание матча, включая опции плей-офф-серии. */
export const matchCreateInputSchema = matchSchema.extend({
  playoffSeriesId: z.preprocess(
    (v) => (v === "" || v == null ? undefined : String(v).trim()),
    z.string().optional()
  ),
  /** new — первая игра новой серии (команды берутся из матча); existing — матч в уже созданной серии */
  playoffSeriesMode: z.preprocess(
    (v) => (v === "" || v == null ? "new" : v),
    z.enum(["new", "existing"])
  ),
  newSeriesLabel: z
    .string()
    .max(120)
    .optional()
    .transform((s) => (s == null || s.trim() === "" ? undefined : s.trim())),
});

export const matchResultSchema = z.object({
  homeScore: z.coerce.number().min(0),
  awayScore: z.coerce.number().min(0),
  overtime: z.boolean().default(false),
  shootout: z.boolean().default(false),
});

export const matchEventSchema = z.object({
  type: z.enum([
    "GOAL", "ASSIST", "YELLOW_CARD", "RED_CARD", "SUBSTITUTION",
    "TIMEOUT", "FOUL", "CORNER", "OFFSIDE", "FREE_KICK",
    "PENALTY_SHOT", "SAVE", "BLOCK",
  ]),
  playerId: z.string().min(1),
  teamId: z.string().min(1),
  period: z.coerce.number().min(1).max(5),
  time: z.string().regex(/^\d{1,2}:\d{2}$/, "Формат: MM:SS"),
});

export const penaltySchema = z.object({
  playerId: z.string().min(1),
  teamId: z.string().min(1),
  minutes: z.coerce.number().min(1),
  reason: z.string().min(1).max(200),
  period: z.coerce.number().min(1).max(5),
  time: z.string().regex(/^\d{1,2}:\d{2}$/),
});

export const newsSchema = z.object({
  title: z.string().min(3, "Минимум 3 символа").max(200),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  content: z.string().min(10).max(100_000),
  tags: z.array(z.string()).default([]),
  publishedAt: z.coerce.date().optional(),
});

export const applicationSchema = z.object({
  teamName: z.string().min(2).max(100),
  contactName: z.string().min(2).max(100),
  contactEmail: z.email("Введите корректный email"),
  contactPhone: z.string().max(20).optional(),
  message: z.string().max(1000).optional(),
  tournamentId: z.string().min(1),
});

export const siteConfigSchema = z.object({
  theme: z.enum(["default", "dark", "sport"]).default("default"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  navItems: z.array(
    z.object({
      label: z.string(),
      href: z.string(),
      children: z
        .array(z.object({ label: z.string(), href: z.string() }))
        .optional(),
    })
  ),
  sections: z.array(
    z.object({
      type: z.string(),
      order: z.number(),
      visible: z.boolean(),
    })
  ),
  footerText: z.string().max(500).optional(),
});

const hex6 = z
  .string()
  .transform((s) => {
    const t = s.trim();
    if (/^[0-9a-fA-F]{6}$/.test(t)) return `#${t}`;
    return t;
  })
  .refine((s) => /^#[0-9a-fA-F]{6}$/.test(s), "Цвет: укажите #RRGGBB (6 hex-символов)");

/** Сохранение темы и палитры (без затирания navItems/sections в БД). */
export const siteAppearanceSchema = z.object({
  theme: z.enum(["default", "dark", "sport"]),
  primaryColor: hex6,
  secondaryColor: hex6,
  footerText: z.string().max(500).optional().nullable(),
});

export type TournamentInput = z.infer<typeof tournamentSchema>;
export type TeamInput = z.infer<typeof teamSchema>;
export type PlayerInput = z.infer<typeof playerSchema>;
export type MatchInput = z.infer<typeof matchSchema>;
export type MatchResultInput = z.infer<typeof matchResultSchema>;
export type MatchEventInput = z.infer<typeof matchEventSchema>;
export type PenaltyInput = z.infer<typeof penaltySchema>;
export type NewsInput = z.infer<typeof newsSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type SiteConfigInput = z.infer<typeof siteConfigSchema>;
