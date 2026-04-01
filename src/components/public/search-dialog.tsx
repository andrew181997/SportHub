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
    const handleOpenSearch = () => setOpen(true);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("sporthub:open-search", handleOpenSearch);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("sporthub:open-search", handleOpenSearch);
    };
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const url = `/api/search?q=${encodeURIComponent(q)}&_=${Date.now()}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (!res.ok) {
        setResults({ players: [], teams: [], news: [] });
        return;
      }
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
    <div className="league-search-backdrop" onClick={() => setOpen(false)}>
      <div className="league-search-panel" onClick={(e) => e.stopPropagation()}>
        <div className="league-search-input-row">
          <Search className="league-search-icon" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск игроков, команд, новостей..."
            className="league-search-input"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="league-search-close"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {results && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.players.length > 0 && (
              <div className="mb-2">
                <p className="league-search-section-title">Игроки</p>
                {results.players.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigate(`/players/${p.id}`)}
                    className="league-search-hit"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            {results.teams.length > 0 && (
              <div className="mb-2">
                <p className="league-search-section-title">Команды</p>
                {results.teams.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => navigate(`/teams/${t.id}`)}
                    className="league-search-hit"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
            {results.news.length > 0 && (
              <div>
                <p className="league-search-section-title">Новости</p>
                {results.news.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => navigate(`/news/${n.slug}`)}
                    className="league-search-hit"
                  >
                    {n.title}
                  </button>
                ))}
              </div>
            )}
            {!results.players.length && !results.teams.length && !results.news.length && (
              <p className="league-search-empty">Ничего не найдено</p>
            )}
          </div>
        )}

        {loading && <div className="league-search-loading">Поиск...</div>}
      </div>
    </div>
  );
}
