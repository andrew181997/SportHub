import { Suspense } from "react";
import { PortalListSearch } from "@/components/public/portal-list-search";

type Props = {
  placeholder: string;
  className?: string;
};

export function PortalListSearchSuspense(props: Props) {
  return (
    <Suspense
      fallback={
        <div
          className={`h-10 max-w-md rounded-lg bg-slate-100 animate-pulse ${props.className ?? ""}`.trim()}
          aria-hidden
        />
      }
    >
      <PortalListSearch {...props} />
    </Suspense>
  );
}
