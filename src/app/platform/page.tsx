import Link from "next/link";
import {
  Trophy,
  Calendar,
  BarChart3,
  Newspaper,
  Smartphone,
  Volleyball,
} from "lucide-react";

const features = [
  {
    icon: Trophy,
    title: "Турнирные таблицы",
    desc: "Автоматический расчёт очков, побед, поражений и разницы мячей",
  },
  {
    icon: Calendar,
    title: "Календарь матчей",
    desc: "Расписание с фильтрами по турниру, команде и дате",
  },
  {
    icon: BarChart3,
    title: "Статистика игроков",
    desc: "Голы, передачи, штрафы, вратарская статистика по каждому матчу",
  },
  {
    icon: Newspaper,
    title: "Новости и медиа",
    desc: "Публикации с WYSIWYG-редактором, фотогалереи и видео",
  },
  {
    icon: Smartphone,
    title: "Мобильная адаптивность",
    desc: "Идеальный вид на любом устройстве — от телефона до десктопа",
  },
  {
    icon: Volleyball,
    title: "Мультиспорт",
    desc: "Хоккей, футбол, баскетбол, волейбол — с терминологией вашего спорта",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Создайте сайт для вашей лиги за&nbsp;5&nbsp;минут
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-100 leading-relaxed">
              Управляйте командами, ведите статистику матчей, публикуйте
              новости — всё в одном месте. Бесплатно для небольших лиг.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-700 shadow-lg hover:bg-blue-50 transition-colors"
              >
                Создать лигу бесплатно
              </Link>
              <Link
                href="/pricing"
                className="rounded-xl border-2 border-white/30 px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Узнать тарифы
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Всё что нужно для вашего турнира
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Полный набор инструментов для организации любительских
              соревнований любого масштаба
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 mb-5">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Готовы начать?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Регистрация занимает меньше минуты. Ваш сайт будет доступен
            по адресу <span className="font-mono text-blue-600">вашалига.sporthub.ru</span>
          </p>
          <Link
            href="/register"
            className="inline-block mt-8 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors"
          >
            Создать лигу бесплатно
          </Link>
        </div>
      </section>
    </>
  );
}
