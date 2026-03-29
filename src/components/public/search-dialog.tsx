"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchResult {
  players: Array<{ id: string; name: string }>;
  teams: Array<{ id: string; name: string }>;
  news: Array<{ id: string; title: string; slug: string }>;
}

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
      <div
        className="mx-auto mt-20 max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск игроков, команд, новостей..."
            className="flex-1 py-3 text-sm outline-none"
          />
          <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {results && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.players.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">
                  Игроки
                </p>
                {results.players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/players/${p.id}`)}
                    className="w-full text-left px-2 py-2 text-sm text-gray-700 rounded hover:bg-gray-100"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            {results.teams.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">
                  Команды
                </p>
                {results.teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/teams/${t.id}`)}
                    className="w-full text-left px-2 py-2 text-sm text-gray-700 rounded hover:bg-gray-100"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
            {results.news.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">
                  Новости
                </p>
                {results.news.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => navigate(`/news/${n.slug}`)}
                    className="w-full text-left px-2 py-2 text-sm text-gray-700 rounded hover:bg-gray-100"
                  >
                    {n.title}
                  </button>
                ))}
              </div>
            )}
            {!results.players.length && !results.teams.length && !results.news.length && (
              <p className="px-2 py-4 text-sm text-gray-400 text-center">
                Ничего не найдено
              </p>
            )}
          </div>
        )}

        {loading && (
          <div className="p-4 text-center text-sm text-gray-400">Поиск...</div>
        )}
      </div>
    </div>
  );
}
