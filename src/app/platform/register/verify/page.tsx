"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { verifyOtp, resendOtp } from "@/actions/auth";

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const password = searchParams.get("p") ?? "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...code];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = useCallback(async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("email", email);
    formData.set("code", fullCode);
    formData.set("password", password);

    const result = await verifyOtp(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "sporthub.ru";
      const slug = result.leagueSlug;
      if (slug) {
        const isDev = window.location.hostname === "localhost" || window.location.hostname.endsWith(".localhost");
        const targetUrl = isDev
          ? `http://${slug}.localhost:${window.location.port}/admin/settings`
          : `https://${slug}.${rootDomain}/admin/settings`;
        window.location.href = targetUrl;
      } else {
        window.location.href = "/admin/settings";
      }
    }
  }, [code, email, password]);

  useEffect(() => {
    if (code.every((d) => d !== "")) handleSubmit();
  }, [code, handleSubmit]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const result = await resendOtp(email);
    if (result.error) setError(result.error);
    setResendCooldown(60);
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Введите код из письма
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Мы отправили 6-значный код на{" "}
          <span className="font-medium text-gray-700">{email}</span>
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-center gap-2" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={loading}
            />
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || code.some((d) => !d)}
          className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Проверяем..." : "Подтвердить"}
        </button>

        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="mt-4 text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
        >
          {resendCooldown > 0
            ? `Отправить повторно (${resendCooldown}с)`
            : "Отправить код повторно"}
        </button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 text-sm text-gray-500">
          Загрузка…
        </div>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
