"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await forgotPassword(formData);
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Восстановление пароля
        </h1>

        {sent ? (
          <div className="mt-6 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700 text-center">
            Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-sm text-gray-500 text-center">
              Введите email, указанный при регистрации
            </p>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Отправляем..." : "Отправить ссылку"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/admin/login" className="text-blue-600 hover:underline">
            Вернуться к входу
          </Link>
        </p>
      </div>
    </div>
  );
}
