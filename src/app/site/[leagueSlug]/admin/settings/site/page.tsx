"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSiteConfig, updateLeagueInfo } from "@/actions/settings";
import { Upload, Palette, Type, ImageIcon } from "lucide-react";

const THEMES = [
  { id: "default", label: "Светлая", preview: "bg-white border" },
  { id: "dark", label: "Тёмная", preview: "bg-gray-900 border-gray-700" },
  { id: "sport", label: "Спортивная", preview: "bg-blue-900 border-blue-700" },
] as const;

export default function SiteSettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState("default");
  const [primaryColor, setPrimaryColor] = useState("#1d4ed8");
  const [secondaryColor, setSecondaryColor] = useState("#9333ea");
  const [leagueName, setLeagueName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSaveTheme = async () => {
    setSaving(true);
    setMessage("");
    const result = await updateSiteConfig({
      theme,
      primaryColor,
      secondaryColor,
      navItems: [],
      sections: [],
    });
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Настройки сохранены");
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
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Информация обновлена");
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

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "logo");

    setMessage("Эмблема загружена");
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Настройки сайта</h1>
      <p className="mt-1 text-sm text-gray-500">
        Настройте внешний вид и содержание вашего сайта лиги
      </p>

      {message && (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      <section className="mt-8 space-y-6">
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Тема оформления
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`rounded-xl p-4 text-center transition-all ${t.preview} ${
                  theme === t.id
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : "hover:shadow-md"
                }`}
              >
                <div
                  className={`h-20 rounded-lg mb-2 ${
                    t.id === "dark" ? "bg-gray-800" : t.id === "sport" ? "bg-blue-800" : "bg-gray-100"
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

          <div className="mt-6 grid grid-cols-2 gap-4">
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
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveTheme}
            disabled={saving}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить тему"}
          </button>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Эмблема лиги
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Логотип для шапки сайта, фавикона и брендинга. Рекомендуемый размер: 200×200px, PNG или SVG.
          </p>
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
              className="hidden"
            />
          </label>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <Type className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Информация о лиге
            </h2>
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
              onClick={handleSaveInfo}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6">
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
