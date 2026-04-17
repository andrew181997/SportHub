/** Блоки главной страницы портала лиги (порядок и видимость в SiteConfig.sections). */

export const HOME_SECTION_TYPES = [
  "hero",
  "upcoming_matches",
  "results",
  "news",
  "standings",
  "teams",
  "apply_cta",
] as const;

export type HomeSectionType = (typeof HOME_SECTION_TYPES)[number];

export type HomeSectionConfig = {
  type: HomeSectionType;
  order: number;
  visible: boolean;
};

export const HOME_SECTION_LABELS: Record<HomeSectionType, string> = {
  hero: "Баннер с названием лиги",
  upcoming_matches: "Ближайшие матчи",
  results: "Последние результаты",
  news: "Новости",
  standings: "Турнирная таблица (превью)",
  teams: "Команды (превью)",
  apply_cta: "Блок «Подать заявку»",
};

export const HOME_SECTION_HINTS: Partial<Record<HomeSectionType, string>> = {
  standings: "Показывает до 8 команд из первого по алфавиту активного турнира",
  teams: "До 6 команд со ссылкой в общий список",
  apply_cta: "Кнопка перехода на страницу заявки",
};

export function defaultHomeSections(): HomeSectionConfig[] {
  return HOME_SECTION_TYPES.map((type, order) => ({
    type,
    order,
    visible:
      type !== "standings" && type !== "teams" && type !== "apply_cta",
  }));
}

/** Разбор JSON из БД: неизвестные типы отбрасываем, порядок нормализуем. */
export function parseHomeSectionsFromDb(json: unknown): HomeSectionConfig[] {
  const defaults = defaultHomeSections();
  if (!Array.isArray(json) || json.length === 0) {
    return defaults;
  }

  const parsed: HomeSectionConfig[] = [];
  for (const item of json) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Partial<HomeSectionConfig>;
    if (!rec.type || !HOME_SECTION_TYPES.includes(rec.type as HomeSectionType)) {
      continue;
    }
    parsed.push({
      type: rec.type as HomeSectionType,
      order: typeof rec.order === "number" && Number.isFinite(rec.order) ? rec.order : 0,
      visible: Boolean(rec.visible),
    });
  }

  parsed.sort((a, b) => a.order - b.order);

  const byType = new Map(parsed.map((s) => [s.type, s] as const));
  const merged: HomeSectionConfig[] = HOME_SECTION_TYPES.map((type, i) => {
    const existing = byType.get(type);
    if (existing) return { ...existing, order: i };
    const d = defaults.find((x) => x.type === type)!;
    return { ...d, order: i };
  });

  merged.sort((a, b) => a.order - b.order);
  return merged.map((s, i) => ({ ...s, order: i }));
}
