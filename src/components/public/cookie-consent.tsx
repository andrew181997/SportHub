"use client";

import { useState, useEffect } from "react";

const COOKIE_CONSENT_KEY = "sporthub_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-gray-600">
          <p>
            Мы используем cookies для обеспечения работы сайта, аналитики и сохранения сессий.
            Продолжая использовать сайт, вы соглашаетесь с{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">
              политикой конфиденциальности
            </a>.
          </p>
        </div>
        <button
          onClick={accept}
          className="shrink-0 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Принять
        </button>
      </div>
    </div>
  );
}
