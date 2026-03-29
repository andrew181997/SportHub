import Link from "next/link";
import { Palette, Navigation, LayoutGrid, Globe } from "lucide-react";

const sections = [
  {
    href: "settings/site",
    icon: Globe,
    title: "Настройки сайта",
    desc: "Тема, эмблема лиги, фото для новостей, бренд",
  },
  {
    href: "settings/theme",
    icon: Palette,
    title: "Тема оформления",
    desc: "Выбор шаблона, цветовая палитра",
  },
  {
    href: "settings/navigation",
    icon: Navigation,
    title: "Навигация",
    desc: "Пункты меню, порядок, вложенность",
  },
  {
    href: "settings/sections",
    icon: LayoutGrid,
    title: "Блоки главной страницы",
    desc: "Включение/отключение разделов, порядок",
  },
];

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Настройки сайта</h1>
      <p className="mt-1 text-sm text-gray-500">Конструктор вашего сайта лиги</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border bg-white p-6 hover:shadow-md transition-shadow"
          >
            <s.icon className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-semibold text-gray-900">{s.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
