"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/actions/auth";

export default function SuperadminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setVerifyUrl(null);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if ("error" in result && result.error) {
      setError(result.error);
      setVerifyUrl("verifyUrl" in result ? result.verifyUrl ?? null : null);
      setLoading(false);
    } else {
      router.push("/superadmin/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">SportHub</h1>
          <p className="text-sm text-gray-400 mt-1">Вход в панель управления</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-gray-800 rounded-2xl p-8"
        >
          {error && (
            <div className="rounded-lg bg-red-900/50 border border-red-700 p-3 text-sm text-red-300 space-y-2">
              <p>{error}</p>
              {verifyUrl ? (
                <Link
                  href={verifyUrl}
                  className="font-medium text-blue-300 hover:underline inline-block"
                >
                  Перейти к подтверждению email
                </Link>
              ) : null}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Пароль
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
