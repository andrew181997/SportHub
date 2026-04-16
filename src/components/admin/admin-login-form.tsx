"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import {
  consumeLoginRateLimitSlot,
  getEmailVerificationUrlIfPending,
} from "@/actions/auth";
import { assertLeagueAdminMembershipAfterLogin } from "@/actions/league-admin-access";
import { Button } from "@/components/ui/button";

const ACCESS_MESSAGES: Record<string, string> = {
  no_access:
    "Эта учётная запись не привязана к админке данной лиги. Войдите под пользователем, у которого есть доступ (для демо: demo@sporthub.ru), либо выйдите и выберите другой аккаунт.",
  blocked: "Аккаунт заблокирован. Обратитесь в поддержку.",
  league_blocked:
    "Доступ к админ-панели этой лиги ограничен. Обратитесь в поддержку.",
};

export function AdminLoginForm({ accessError }: { accessError?: string }) {
  const [error, setError] = useState("");
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoutPending, startLogout] = useTransition();

  const accessHint = accessError ? ACCESS_MESSAGES[accessError] ?? accessError : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    if (!email || !password) {
      setError("Введите email и пароль");
      return;
    }

    setLoading(true);
    setError("");
    setVerifyUrl(null);

    const gate = await consumeLoginRateLimitSlot();
    if (gate.error) {
      setError(gate.error);
      setLoading(false);
      return;
    }

    try {
      const pendingUrl = await getEmailVerificationUrlIfPending(email, password);
      if (pendingUrl) {
        setError(
          "Сначала подтвердите email: введите код из письма, отправленного на вашу почту."
        );
        setVerifyUrl(pendingUrl);
        setLoading(false);
        return;
      }

      // next-auth/react при redirect: false делает new URL(data.url): относительный путь ломает вход.
      const callbackUrl = `${window.location.origin}/admin/dashboard`;
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Неверный email или пароль");
        setLoading(false);
        return;
      }

      const redirectUrl = typeof result?.url === "string" ? result.url : "";
      if (
        redirectUrl.includes("/api/auth/error") ||
        redirectUrl.includes("error=CredentialsSignin") ||
        redirectUrl.includes("error=Configuration")
      ) {
        setError("Неверный email или пароль");
        setLoading(false);
        return;
      }

      if (!result?.ok) {
        setError("Не удалось выполнить вход. Попробуйте ещё раз.");
        setLoading(false);
        return;
      }

      const access = await assertLeagueAdminMembershipAfterLogin();
      if (!access.ok) {
        if (access.reason === "no_membership") {
          await signOut({ redirect: false });
          window.location.assign("/admin/login?error=no_access");
          return;
        }
        if (access.reason === "league_blocked") {
          await signOut({ redirect: false });
          window.location.assign("/admin/login?error=league_blocked");
          return;
        }
        setError("Не удалось проверить доступ к админке. Откройте сайт с поддомена лиги (например demo.localhost).");
        setLoading(false);
        return;
      }

      window.location.assign("/admin/dashboard");
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
      setLoading(false);
    }
  }

  function handleLogout() {
    startLogout(async () => {
      await signOut({ redirect: false });
      window.location.assign("/admin/login");
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Вход в админку</h1>
        </div>

        {accessHint ? (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 space-y-3">
            <p>{accessHint}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={logoutPending}
              className="w-full"
              onClick={handleLogout}
            >
              {logoutPending ? "Выход…" : "Выйти из аккаунта"}
            </Button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border p-8 shadow-sm">
          {error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 space-y-2">
              <p>{error}</p>
              {verifyUrl ? (
                <Link
                  href={verifyUrl}
                  className="font-medium text-blue-700 hover:underline inline-block"
                >
                  Перейти к подтверждению email
                </Link>
              ) : null}
            </div>
          ) : null}

          <div>
            <label htmlFor="admin-login-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="admin-login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="admin-login-password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              id="admin-login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Вход..." : "Войти"}
          </button>

          <p className="text-center text-sm text-gray-500">
            <Link href="/forgot-password" className="text-blue-600 hover:underline">
              Забыли пароль?
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
