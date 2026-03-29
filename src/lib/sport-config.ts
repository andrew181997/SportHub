import type { SportType, MatchEventType, PlayerRole } from "@prisma/client";

export interface SportConfig {
  label: string;
  positions: { value: PlayerRole; label: string }[];
  eventTypes: { value: MatchEventType; label: string }[];
  terminology: {
    goal: string;
    assist: string;
    period: string;
    periods: number;
    score: string;
  };
  statsFields: string[];
}

export const SPORT_CONFIGS: Record<SportType, SportConfig> = {
  HOCKEY: {
    label: "Хоккей",
    positions: [
      { value: "SKATER", label: "Полевой" },
      { value: "GOALIE", label: "Вратарь" },
      { value: "FORWARD", label: "Нападающий" },
      { value: "DEFENDER", label: "Защитник" },
    ],
    eventTypes: [
      { value: "GOAL", label: "Гол" },
      { value: "ASSIST", label: "Передача" },
      { value: "PENALTY_SHOT", label: "Буллит" },
      { value: "SAVE", label: "Сэйв" },
      { value: "BLOCK", label: "Блок" },
    ],
    terminology: {
      goal: "Шайба",
      assist: "Передача",
      period: "Период",
      periods: 3,
      score: "Счёт",
    },
    statsFields: ["goals", "assists", "penaltyMinutes", "shots", "saves", "shutouts"],
  },
  FOOTBALL: {
    label: "Футбол",
    positions: [
      { value: "GOALIE", label: "Вратарь" },
      { value: "DEFENDER", label: "Защитник" },
      { value: "MIDFIELDER", label: "Полузащитник" },
      { value: "FORWARD", label: "Нападающий" },
    ],
    eventTypes: [
      { value: "GOAL", label: "Гол" },
      { value: "ASSIST", label: "Голевая передача" },
      { value: "YELLOW_CARD", label: "Жёлтая карточка" },
      { value: "RED_CARD", label: "Красная карточка" },
      { value: "SUBSTITUTION", label: "Замена" },
      { value: "CORNER", label: "Угловой" },
      { value: "OFFSIDE", label: "Офсайд" },
      { value: "FREE_KICK", label: "Штрафной удар" },
      { value: "PENALTY_SHOT", label: "Пенальти" },
      { value: "FOUL", label: "Фол" },
    ],
    terminology: {
      goal: "Гол",
      assist: "Голевая передача",
      period: "Тайм",
      periods: 2,
      score: "Счёт",
    },
    statsFields: ["goals", "assists", "yellowCards", "redCards", "corners", "shots"],
  },
  BASKETBALL: {
    label: "Баскетбол",
    positions: [
      { value: "CENTER", label: "Центровой" },
      { value: "FORWARD", label: "Форвард" },
      { value: "GUARD", label: "Защитник" },
      { value: "WING", label: "Крайний" },
    ],
    eventTypes: [
      { value: "GOAL", label: "Бросок (2 очка)" },
      { value: "ASSIST", label: "Передача" },
      { value: "FOUL", label: "Фол" },
      { value: "FREE_KICK", label: "Штрафной бросок" },
      { value: "BLOCK", label: "Блок-шот" },
      { value: "TIMEOUT", label: "Тайм-аут" },
      { value: "SUBSTITUTION", label: "Замена" },
    ],
    terminology: {
      goal: "Бросок",
      assist: "Передача",
      period: "Четверть",
      periods: 4,
      score: "Счёт",
    },
    statsFields: ["points", "assists", "rebounds", "steals", "blocks", "fouls"],
  },
  VOLLEYBALL: {
    label: "Волейбол",
    positions: [
      { value: "SETTER", label: "Связующий" },
      { value: "LIBERO", label: "Либеро" },
      { value: "WING", label: "Доигровщик" },
      { value: "CENTER", label: "Центральный блокирующий" },
      { value: "FORWARD", label: "Диагональный" },
    ],
    eventTypes: [
      { value: "GOAL", label: "Очко" },
      { value: "ASSIST", label: "Передача" },
      { value: "BLOCK", label: "Блок" },
      { value: "SUBSTITUTION", label: "Замена" },
      { value: "TIMEOUT", label: "Тайм-аут" },
    ],
    terminology: {
      goal: "Очко",
      assist: "Передача",
      period: "Сет",
      periods: 5,
      score: "Счёт",
    },
    statsFields: ["points", "aces", "blocks", "digs", "kills"],
  },
  OTHER: {
    label: "Другой",
    positions: [
      { value: "OTHER", label: "Игрок" },
      { value: "GOALIE", label: "Вратарь" },
      { value: "FORWARD", label: "Нападающий" },
      { value: "DEFENDER", label: "Защитник" },
    ],
    eventTypes: [
      { value: "GOAL", label: "Гол / Очко" },
      { value: "ASSIST", label: "Передача" },
      { value: "YELLOW_CARD", label: "Предупреждение" },
      { value: "RED_CARD", label: "Удаление" },
      { value: "SUBSTITUTION", label: "Замена" },
      { value: "FOUL", label: "Нарушение" },
      { value: "TIMEOUT", label: "Тайм-аут" },
    ],
    terminology: {
      goal: "Гол",
      assist: "Передача",
      period: "Период",
      periods: 2,
      score: "Счёт",
    },
    statsFields: ["goals", "assists", "fouls"],
  },
};

export function getSportConfig(sportType: SportType): SportConfig {
  return SPORT_CONFIGS[sportType];
}

export function getPositionsForSport(sportType: SportType) {
  return SPORT_CONFIGS[sportType].positions;
}

export function getEventTypesForSport(sportType: SportType) {
  return SPORT_CONFIGS[sportType].eventTypes;
}

export function getEventTypeLabel(
  sportType: SportType,
  eventType: MatchEventType
): string {
  const cfg = SPORT_CONFIGS[sportType];
  return cfg.eventTypes.find((e) => e.value === eventType)?.label ?? eventType;
}
