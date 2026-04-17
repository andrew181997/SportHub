import { Suspense } from "react";
import { TournamentFilter } from "@/components/public/tournament-filter";

type Props = {
  tournaments: { id: string; name: string }[];
  className?: string;
};

export function TournamentFilterSuspense(props: Props) {
  return (
    <Suspense
      fallback={
        <div
          className={`h-10 rounded-lg bg-slate-100 animate-pulse ${props.className ?? ""}`.trim()}
          aria-hidden
        />
      }
    >
      <TournamentFilter {...props} />
    </Suspense>
  );
}
