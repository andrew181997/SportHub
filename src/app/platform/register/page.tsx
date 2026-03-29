"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { register as registerAction, checkSlugAvailability } from "@/actions/auth";
import type { RegisterInput } from "@/lib/validations/auth";

const sportOptions = [
  { value: "HOCKEY", label: "Хоккей" },
  { value: "FOOTBALL", label: "Футбол" },
  { value: "BASKETBALL", label: "Баскетбол" },
  { value: "VOLLEYBALL", label: "Волейбол" },
  { value: "OTHER", label: "Другой" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    defaultValues: { sportType: "HOCKEY" },
  });

  const slugValue = watch("slug");

  const checkSlug = useCallback(
    async (slug: string) => {
      if (!slug || slug.length < 3) {
        setSlugStatus("idle");
        return;
      }
      setSlugStatus("checking");
      const { available } = await checkSlugAvailability(slug);
      setSlugStatus(available ? "available" : "taken");
    },
    []
  );

  const onSubmit = async (data: RegisterInput) => {
    setError("");
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, String(v)));

    const result = await registerAction(formData);
    if (result.error) {
      setError(result.error);
    } else {
      router.push(`/register/verify?email=${encodeURIComponent(data.email)}&p=${encodeURIComponent(data.password)}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Создать лигу
          </h1>
          <p className="mt-2 text-gray-500">
            Заполните форму для регистрации
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 bg-white rounded-2xl border p-8 shadow-sm"
        >
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register("email", { required: "Введите email" })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ваше имя
            </label>
            <input
              {...register("name", { required: "Введите имя", minLength: { value: 2, message: "Минимум 2 символа" } })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Иван Петров"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              {...register("password", {
                required: "Введите пароль",
                minLength: { value: 8, message: "Минимум 8 символов" },
              })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Минимум 8 символов"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название лиги
            </label>
            <input
              {...register("leagueName", { required: "Введите название", minLength: { value: 2, message: "Минимум 2 символа" } })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Единая Хоккейная Лига"
            />
            {errors.leagueName && (
              <p className="mt-1 text-xs text-red-600">{errors.leagueName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Адрес сайта
            </label>
            <div className="flex items-center gap-1">
              <input
                {...register("slug", {
                  required: "Введите адрес",
                  minLength: { value: 3, message: "Минимум 3 символа" },
                  pattern: { value: /^[a-z0-9-]+$/, message: "Только латиница, цифры и дефис" },
                  onChange: (e) => {
                    const timer = setTimeout(() => checkSlug(e.target.value), 500);
                    return () => clearTimeout(timer);
                  },
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="myliga"
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">
                .sporthub.ru
              </span>
            </div>
            {errors.slug && (
              <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>
            )}
            {slugStatus === "checking" && (
              <p className="mt-1 text-xs text-gray-500">Проверяем...</p>
            )}
            {slugStatus === "available" && (
              <p className="mt-1 text-xs text-green-600">Адрес свободен ✓</p>
            )}
            {slugStatus === "taken" && (
              <p className="mt-1 text-xs text-red-600">Адрес уже занят</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Вид спорта
            </label>
            <select
              {...register("sportType")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {sportOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || slugStatus === "taken"}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Регистрация..." : "Зарегистрироваться"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Нажимая кнопку, вы соглашаетесь с{" "}
            <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
              условиями использования
            </a>{" "}
            и{" "}
            <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
              политикой конфиденциальности
            </a>
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Уже есть аккаунт?{" "}
          <Link href="/admin/login" className="text-blue-600 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
