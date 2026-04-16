import {
  superadminBlockLeague,
  superadminBlockUser,
  superadminUnblockLeague,
  superadminUnblockUser,
} from "@/actions/superadmin-moderation";

const btnBase =
  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50";

export function SuperadminUserModeration({
  userId,
  status,
}: {
  userId: string;
  status: "PENDING" | "ACTIVE" | "BLOCKED";
}) {
  if (status === "BLOCKED") {
    return (
      <form action={superadminUnblockUser}>
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          className={`${btnBase} bg-slate-100 text-slate-800 hover:bg-slate-200`}
        >
          Разблокировать
        </button>
      </form>
    );
  }
  return (
    <form action={superadminBlockUser}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        className={`${btnBase} bg-red-50 text-red-800 hover:bg-red-100 border border-red-200`}
      >
        Заблокировать
      </button>
    </form>
  );
}

export function SuperadminLeagueModeration({
  leagueId,
  status,
}: {
  leagueId: string;
  status: "ACTIVE" | "BLOCKED";
}) {
  if (status === "BLOCKED") {
    return (
      <form action={superadminUnblockLeague}>
        <input type="hidden" name="leagueId" value={leagueId} />
        <button
          type="submit"
          className={`${btnBase} bg-slate-100 text-slate-800 hover:bg-slate-200`}
        >
          Разблокировать лигу
        </button>
      </form>
    );
  }
  return (
    <form action={superadminBlockLeague}>
      <input type="hidden" name="leagueId" value={leagueId} />
      <button
        type="submit"
        className={`${btnBase} bg-red-50 text-red-800 hover:bg-red-100 border border-red-200`}
      >
        Заблокировать лигу
      </button>
    </form>
  );
}
