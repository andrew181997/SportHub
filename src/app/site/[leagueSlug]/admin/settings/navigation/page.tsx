"use client";

import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  href: string;
}

const defaultItems: NavItem[] = [
  { id: "1", label: "Турниры", href: "/tournaments" },
  { id: "2", label: "Календарь", href: "/calendar" },
  { id: "3", label: "Таблица", href: "/standings" },
  { id: "4", label: "Команды", href: "/teams" },
  { id: "5", label: "Игроки", href: "/players" },
  { id: "6", label: "Новости", href: "/news" },
  { id: "7", label: "Медиа", href: "/media" },
  { id: "8", label: "О лиге", href: "/about" },
];

export default function NavigationSettingsPage() {
  const [items, setItems] = useState<NavItem[]>(defaultItems);

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), label: "Новый раздел", href: "/" },
    ]);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Навигация</h1>
      <p className="mt-1 text-sm text-gray-500">
        Настройте пункты меню вашего сайта
      </p>

      <div className="mt-6 max-w-xl space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border bg-white p-3"
          >
            <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
            <input
              value={item.label}
              onChange={(e) =>
                setItems(
                  items.map((i) =>
                    i.id === item.id ? { ...i, label: e.target.value } : i
                  )
                )
              }
              className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
            />
            <input
              value={item.href}
              onChange={(e) =>
                setItems(
                  items.map((i) =>
                    i.id === item.id ? { ...i, href: e.target.value } : i
                  )
                )
              }
              className="w-40 rounded border border-gray-200 px-2 py-1 text-sm font-mono"
            />
            <button
              onClick={() => removeItem(item.id)}
              className="p-1 text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          onClick={addItem}
          className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 p-3 w-full text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить пункт
        </button>

        <div className="pt-4">
          <button className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
