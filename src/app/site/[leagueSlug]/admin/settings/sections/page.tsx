"use client";

import { useState } from "react";
import { GripVertical, Eye, EyeOff } from "lucide-react";

interface Section {
  id: string;
  type: string;
  label: string;
  visible: boolean;
}

const defaultSections: Section[] = [
  { id: "1", type: "hero", label: "Баннер", visible: true },
  { id: "2", type: "upcoming_matches", label: "Ближайшие матчи", visible: true },
  { id: "3", type: "results", label: "Последние результаты", visible: true },
  { id: "4", type: "standings", label: "Турнирная таблица", visible: true },
  { id: "5", type: "news", label: "Новости", visible: true },
  { id: "6", type: "teams", label: "Команды", visible: false },
  { id: "7", type: "apply_cta", label: "Подать заявку", visible: false },
];

export default function SectionsSettingsPage() {
  const [sections, setSections] = useState<Section[]>(defaultSections);

  const toggleVisibility = (id: string) => {
    setSections(
      sections.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s
      )
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Блоки главной страницы</h1>
      <p className="mt-1 text-sm text-gray-500">
        Включайте, выключайте и упорядочивайте блоки
      </p>

      <div className="mt-6 max-w-xl space-y-2">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
              section.visible ? "bg-white" : "bg-gray-50 opacity-60"
            }`}
          >
            <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
            <span className="flex-1 text-sm font-medium text-gray-900">
              {section.label}
            </span>
            <span className="text-xs text-gray-400 font-mono">
              {section.type}
            </span>
            <button
              onClick={() => toggleVisibility(section.id)}
              className="p-1 text-gray-400 hover:text-gray-700"
            >
              {section.visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}

        <div className="pt-4">
          <button className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
