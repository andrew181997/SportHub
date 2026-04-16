"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReferee } from "@/actions/referees";
import { Button } from "@/components/ui/button";

export function DeleteRefereeButton({ refereeId }: { refereeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      className="text-red-600 border-red-200 hover:bg-red-50"
      onClick={() => {
        if (!confirm("Удалить судью из справочника? Назначения в протоколах будут сняты.")) {
          return;
        }
        startTransition(async () => {
          const r = await deleteReferee(refereeId);
          if (r.error) {
            alert(r.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      {pending ? "…" : "Удалить"}
    </Button>
  );
}
