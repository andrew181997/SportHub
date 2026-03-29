import { z } from "zod/v4";

export const tournamentSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа").max(100),
  type: z.enum(["REGULAR", "PLAYOFF", "GROUP_STAGE", "CUP"]),
  seasonId: z.string().min(1, "Выберите сезон"),
});

export const seasonSchema = z.object({
  name: z.string().min(3, "Например: 2025-2026").max(20),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isCurrent: z.boolean().optional(),
});

export const teamSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа").max(100),
  city: z.string().max(100).optional(),
  foundedYear: z.coerce.number().min(1800).max(2100).optional(),
  description: z.string().max(5000).optional(),
  contactEmail: z.email().optional().or(z.literal("")),
});

export const playerSchema = z.object({
  firstName: z.string().min(1, "Введите имя").max(100),
  lastName: z.string().min(1, "Введите фамилию").max(100),
  middleName: z.string().max(100).optional(),
  birthDate: z.coerce.date().optional(),
  role: z.enum([
    "SKATER", "GOALIE", "FORWARD", "DEFENDER", "MIDFIELDER",
    "SETTER", "LIBERO", "CENTER", "GUARD", "WING", "OTHER",
  ]).default("SKATER"),
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

export type TournamentInput = z.infer<typeof tournamentSchema>;
export type SeasonInput = z.infer<typeof seasonSchema>;
export type TeamInput = z.infer<typeof teamSchema>;
export type PlayerInput = z.infer<typeof playerSchema>;
export type MatchInput = z.infer<typeof matchSchema>;
export type MatchResultInput = z.infer<typeof matchResultSchema>;
export type MatchEventInput = z.infer<typeof matchEventSchema>;
export type PenaltyInput = z.infer<typeof penaltySchema>;
export type NewsInput = z.infer<typeof newsSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type SiteConfigInput = z.infer<typeof siteConfigSchema>;
