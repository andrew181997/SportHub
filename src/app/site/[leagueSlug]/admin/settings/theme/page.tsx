"use client";

import { useState } from "react";

const themes = [
  { id: "default", name: "Светлая", preview: "bg-white border" },
  { id: "dark", name: "Тёмная", preview: "bg-gray-900" },
  { id: "sport", name: "Спортивная", preview: "bg-gradient-to-br from-blue-600 to-purple-700" },
];

export default function ThemeSettingsPage() {
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [primaryColor, setPrimaryColor] = useState("#1d4ed8");
  const [secondaryColor, setSecondaryColor] = useState("#9333ea");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Тема оформления</h1>

      <div className="mt-6 space-y-8 max-w-2xl">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Шаблон</h2>
          <div className="grid grid-cols-3 gap-4">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`rounded-xl border-2 p-4 text-center transition-colors ${
                  selectedTheme === theme.id
                    ? "border-blue-600"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-full h-20 rounded-lg ${theme.preview} mb-3`} />
                <span className="text-sm font-medium text-gray-900">{theme.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Цвета</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Основной цвет
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
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
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </section>

        <button className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          Сохранить
        </button>
      </div>
    </div>
  );
}
