"use client";

import { useState } from "react";

export default function NotificationsPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Системные уведомления</h1>
      <p className="mt-1 text-sm text-gray-500">Рассылка email всем админам лиг</p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Тема</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="Тема уведомления"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Сообщение</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            placeholder="Текст уведомления..."
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Отправить
        </button>
        {sent && (
          <p className="text-sm text-green-600">Уведомление отправлено</p>
        )}
      </form>
    </div>
  );
}
