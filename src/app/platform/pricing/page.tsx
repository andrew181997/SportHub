import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Бесплатный",
    price: "0 ₽",
    period: "навсегда",
    features: [
      "До 5 команд",
      "1 турнир за сезон",
      "До 50 игроков",
      "Базовая статистика",
      "Публичный сайт лиги",
      "100 МБ для медиа",
    ],
    cta: "Начать бесплатно",
    highlight: false,
  },
  {
    name: "Стандарт",
    price: "990 ₽",
    period: "в месяц",
    features: [
      "До 20 команд",
      "10 турниров за сезон",
      "До 500 игроков",
      "Полная статистика",
      "Конструктор сайта",
      "1 ГБ для медиа",
      "Приоритетная поддержка",
    ],
    cta: "Выбрать Стандарт",
    highlight: true,
  },
  {
    name: "Про",
    price: "2 490 ₽",
    period: "в месяц",
    features: [
      "До 50 команд",
      "Безлимит турниров",
      "До 2 000 игроков",
      "Расширенная аналитика",
      "Кастомный домен",
      "10 ГБ для медиа",
      "Приоритетная поддержка",
      "Экспорт данных в CSV",
    ],
    cta: "Выбрать Про",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Тарифы</h1>
          <p className="mt-4 text-lg text-gray-500">
            Выберите план, подходящий для вашей лиги
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? "border-blue-600 shadow-xl ring-2 ring-blue-600 relative"
                  : "border-gray-200 shadow-sm"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                  Популярный
                </div>
              )}
              <h3 className="text-xl font-semibold text-gray-900">
                {plan.name}
              </h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-500 ml-1">/ {plan.period}</span>
              </div>
              <ul className="mt-8 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-8 block text-center rounded-lg px-6 py-3 font-medium transition-colors ${
                  plan.highlight
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
