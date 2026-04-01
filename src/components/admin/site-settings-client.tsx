"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSiteConfig, updateLeagueInfo, uploadLogo } from "@/actions/settings";
import { Upload, Palette, Type, ImageIcon, Sparkles } from "lucide-react";
import type { LeagueThemeId } from "@/lib/league-theme";

const THEMES: { id: LeagueThemeId; label: string; preview: string }[] = [
  { id: "default", label: "Светлая", preview: "bg-white border border-slate-200" },
  { id: "dark", label: "Тёмная", preview: "bg-slate-900 border border-slate-700" },
  { id: "sport", label: "Спортивная", preview: "bg-gradient-to-br from-blue-700 to-violet-800 border border-violet-600" },
];

const COLOR_PRESETS: { label: string; primary: string; secondary: string }[] = [
  { label: "Классика", primary: "#1d4ed8", secondary: "#9333ea" },
  { label: "Лёд", primary: "#0369a1", secondary: "#0e7490" },
  { label: "Огонь", primary: "#dc2626", secondary: "#ea580c" },
  { label: "Лес", primary: "#15803d", secondary: "#a16207" },
  { label: "Ночь", primary: "#6366f1", secondary: "#a855f7" },
  { label: "Золото", primary: "#b45309", secondary: "#ca8a04" },
];

export type SiteSettingsInitial = {
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  leagueName: string;
  description: string;
  logoUrl: string | null;
};

export function SiteSettingsClient({ initial }: { initial: SiteSettingsInitial }) {
  const router = useRouter();
  const [theme, setTheme] = useState<LeagueThemeId>((initial.theme as LeagueThemeId) ?? "default");
  const [primaryColor, setPrimaryColor] = useState(initial.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(initial.secondaryColor);
  const [footerText, setFooterText] = useState(initial.footerText);
  const [leagueName, setLeagueName] = useState(initial.leagueName);
  const [description, setDescription] = useState(initial.description);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSaveTheme = async () => {
    setSaving(true);
    setMessage("");
    const result = await updateSiteConfig({
      theme,
      primaryColor,
      secondaryColor,
      footerText: footerText.trim() || null,
    });
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Тема и цвета сохранены. Обновите публичный сайт — изменения уже на месте.");
      router.refresh();
    }
    setSaving(false);
  };

  const handleSaveInfo = async () => {
    setSaving(true);
    setMessage("");
    const formData = new FormData();
    formData.set("name", leagueName);
    formData.set("description", description);
    const result = await updateLeagueInfo(formData);
    if ("error" in result) {
      setMessage(result.error);
    } else {
      setMessage("Информация обновлена");
      router.refresh();
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Максимальный размер файла — 5 МБ");
      return;
    }

    setSaving(true);
    setMessage("");
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadLogo(formData);
    if ("error" in result) {
      setMessage(result.error ?? "Ошибка загрузки");
    } else {
      if (result.url) setLogoUrl(result.url);
      setMessage("Эмблема загружена");
      router.refresh();
    }
    setSaving(false);
    e.target.value = "";
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Настройки сайта</h1>
      <p className="mt-1 text-sm text-gray-500">
        Тема, цвета и текст подвала применяются на публичном сайте лиги сразу после сохранения.
      </p>

      {message && (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      <section className="mt-8 space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Тема оформления</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`rounded-xl p-4 text-center transition-all ${t.preview} ${
                  theme === t.id
                    ? "ring-2 ring-blue-600 ring-offset-2"
                    : "hover:shadow-md"
                }`}
              >
                <div
                  className={`h-20 rounded-lg mb-2 ${
                    t.id === "dark"
                      ? "bg-slate-800"
                      : t.id === "sport"
                        ? "bg-gradient-to-br from-blue-600 to-violet-700"
                        : "bg-slate-100"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    t.id === "dark" || t.id === "sport" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-gray-700">Быстрые палитры</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setPrimaryColor(p.primary);
                    setSecondaryColor(p.secondary);
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                >
                  {p.label}
                  <span
                    className="ml-2 inline-flex gap-0.5 align-middle"
                    aria-hidden
                  >
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-black/10"
                      style={{ backgroundColor: p.primary }}
                    />
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-black/10"
                      style={{ backgroundColor: p.secondary }}
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Основной цвет
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                  placeholder="#1d4ed8"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дополнительный цвет
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                  placeholder="#9333ea"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Текст в подвале сайта
            </label>
            <textarea
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder={`© ${new Date().getFullYear()} Название лиги · Все права защищены`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Если пусто — подставится год и название лиги автоматически.
            </p>
          </div>

          <div
            className="mt-6 rounded-xl border border-dashed border-gray-200 p-4"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}22 0%, ${secondaryColor}22 100%)`,
            }}
          >
            <p className="text-xs font-medium text-gray-600 mb-2">Предпросмотр шапки (спортивная тема)</p>
            <div
              className="rounded-lg px-4 py-3 text-white text-sm font-semibold shadow-inner"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              }}
            >
              {leagueName || "Название лиги"}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveTheme}
            disabled={saving}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить тему и цвета"}
          </button>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Эмблема лиги</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Логотип для шапки сайта и брендинга. Рекомендуемый размер: 200×200px, PNG или SVG.
          </p>
          {logoUrl && (
            <div className="mb-4 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Эмблема" className="h-16 w-16 rounded-lg border object-contain bg-white" />
              <span className="text-xs text-gray-500 break-all">{logoUrl}</span>
            </div>
          )}
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">
                Нажмите для загрузки или перетащите файл
              </span>
              <span className="block text-xs text-gray-400 mt-1">
                PNG, SVG, JPG до 5 МБ
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={saving}
              className="hidden"
            />
          </label>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Type className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Информация о лиге</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название лиги
              </label>
              <input
                type="text"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Единая Хоккейная Лига"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                placeholder="Расскажите о вашей лиге..."
              />
            </div>
            <button
              type="button"
              onClick={handleSaveInfo}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Фотографии для новостей турнира
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Загрузите фотографии для использования в обложках и теле новостных публикаций.
          </p>
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <div className="text-center">
              <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">
                Загрузить фотографии
              </span>
              <span className="block text-xs text-gray-400 mt-1">
                PNG, JPG, WebP до 5 МБ каждая
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
