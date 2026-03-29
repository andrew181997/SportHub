import type { MatchEventType, SportType } from "@prisma/client";
import { Goal } from "lucide-react";

/** Шайба (хоккей) */
export function PuckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden>
      <rect x="2" y="5" width="20" height="6" rx="2" fill="#111827" />
      <rect x="5" y="6.5" width="14" height="3" rx="1" fill="#374151" />
    </svg>
  );
}

/** Мяч (футбол) */
export function SoccerBallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="white" stroke="#1f2937" strokeWidth={2} />
      <path
        d="M12 5.5l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z"
        fill="#1f2937"
      />
    </svg>
  );
}

/** Баскетбольный мяч */
export function BasketballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#ea580c" stroke="#7c2d12" strokeWidth={2} />
      <path
        d="M12 2v20M2 12h20M4.5 4.5c4 4 11 4 15 0M4.5 19.5c4-4 11-4 15 0"
        fill="none"
        stroke="#431407"
        strokeWidth={1.75}
        opacity={0.95}
      />
    </svg>
  );
}

/** Волейбольный мяч */
export function VolleyballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" className="fill-yellow-100 stroke-amber-800 stroke-2" />
      <path
        d="M12 2c-3 4-3 16 0 20M4 8c5 2 11 2 16 0M4 16c5-2 11-2 16 0"
        className="stroke-amber-900 stroke-[1.5] fill-none"
      />
    </svg>
  );
}

export function SportGoalMarker({ sportType, className }: { sportType: SportType; className?: string }) {
  const cn = className ?? "h-5 w-5 shrink-0";
  switch (sportType) {
    case "HOCKEY":
      return <PuckIcon className={cn} />;
    case "FOOTBALL":
      return <SoccerBallIcon className={cn} />;
    case "BASKETBALL":
      return <BasketballIcon className={cn} />;
    case "VOLLEYBALL":
      return <VolleyballIcon className={cn} />;
    default:
      return <Goal className={`${cn} text-emerald-600`} strokeWidth={2} aria-hidden />;
  }
}

/** Свисток судьи */
export function WhistleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <path
        d="M8 8h8v6a4 4 0 01-4 4v0a4 4 0 01-4-4V8z"
        className="stroke-amber-700 stroke-2 fill-amber-50"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="11" r="1.2" className="fill-amber-900" />
      <path d="M16 10h4l1 2h-3" className="stroke-amber-800 stroke-2" strokeLinecap="round" />
    </svg>
  );
}

export function YellowCardIcon({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded-sm shadow-sm border border-amber-700/30 ${className ?? "h-6 w-4 bg-yellow-400"}`}
      aria-hidden
    />
  );
}

export function RedCardIcon({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded-sm shadow-sm border border-red-900/30 ${className ?? "h-6 w-4 bg-red-600"}`}
      aria-hidden
    />
  );
}

/** Иконка для строки удаления в протоколе (не MatchEvent). */
export function PenaltyRowIcon({ sportType }: { sportType: SportType }) {
  switch (sportType) {
    case "FOOTBALL":
    case "OTHER":
      return (
        <span className="flex items-center gap-0.5 shrink-0" aria-hidden>
          <YellowCardIcon className="h-5 w-3.5" />
        </span>
      );
    case "HOCKEY":
    case "BASKETBALL":
    case "VOLLEYBALL":
    default:
      return <WhistleIcon className="h-5 w-5 shrink-0 text-amber-800" />;
  }
}

/** Иконка для события в ленте (гол, карточка, фол и т.д.). */
export function MatchEventMarker({
  sportType,
  type,
}: {
  sportType: SportType;
  type: MatchEventType;
}) {
  if (type === "GOAL" || type === "PENALTY_SHOT") {
    return <SportGoalMarker sportType={sportType} className="h-5 w-5 shrink-0" />;
  }
  if (type === "YELLOW_CARD") {
    return <YellowCardIcon className="h-6 w-4 shrink-0" />;
  }
  if (type === "RED_CARD") {
    return <RedCardIcon className="h-6 w-4 shrink-0" />;
  }
  if (
    type === "FOUL" ||
    type === "OFFSIDE" ||
    type === "FREE_KICK" ||
    type === "CORNER"
  ) {
    if (sportType === "FOOTBALL") {
      return <YellowCardIcon className="h-5 w-3 opacity-80 shrink-0" />;
    }
    return <WhistleIcon className="h-5 w-5 shrink-0 text-amber-800" />;
  }
  if (type === "ASSIST") {
    return null;
  }
  return <WhistleIcon className="h-4 w-4 shrink-0 text-gray-500 opacity-70" />;
}
