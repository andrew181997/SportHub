"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { addTeamToTournament, removeTeamFromTournament } from "@/actions/tournament-teams";
import { Button } from "@/components/ui/button";

type Member = { id: string; name: string };

export function TournamentTeamsCell({
  tournamentId,
  archived,
  members,
  leagueTeams,
}: {
  tournamentId: string;
  archived: boolean;
  members: Member[];
  leagueTeams: Member[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [teamId, setTeamId] = useState("");
  const [pending, startTransition] = useTransition();

  const memberIds = new Set(members.map((m) => m.id));
  const available = leagueTeams.filter((t) => !memberIds.has(t.id));

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!teamId) return;
    startTransition(async () => {
      const r = await addTeamToTournament(tournamentId, teamId);
      if (r.error) {
        setError(r.error);
        return;
      }
      setTeamId("");
      router.refresh();
    });
  }

  function onRemove(id: string) {
    setError("");
    startTransition(async () => {
      const r = await removeTeamFromTournament(tournamentId, id);
      if (r.error) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="max-w-[220px] space-y-2 text-left">
      <div className="flex flex-wrap gap-1">
        {members.length === 0 ? (
          <span className="text-xs text-gray-400">Нет команд</span>
        ) : (
          members.map((m) => (
            <span
              key={m.id}
              className="inline-flex max-w-full items-center gap-0.5 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-800"
            >
              <span className="truncate" title={m.name}>
                {m.name}
              </span>
              {!archived && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onRemove(m.id)}
                  className="shrink-0 rounded p-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                  aria-label={`Убрать ${m.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))
        )}
      </div>
      {!archived && available.length > 0 && (
        <form onSubmit={onAdd} className="flex flex-col gap-1">
          <div className="flex gap-1">
            <select
              value={teamId}
              disabled={pending}
              onChange={(e) => setTeamId(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Команда…</option>
              {available.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" disabled={pending || !teamId} className="shrink-0 text-xs px-2 py-1 h-auto">
              +
            </Button>
          </div>
        </form>
      )}
      {!archived && available.length === 0 && members.length > 0 && (
        <p className="text-[10px] text-gray-400">Все команды лиги уже в турнире</p>
      )}
      {error ? <p className="text-[10px] text-red-600">{error}</p> : null}
    </div>
  );
}
