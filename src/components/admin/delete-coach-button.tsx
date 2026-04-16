"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCoach } from "@/actions/coaches";
import { Button } from "@/components/ui/button";

export function DeleteCoachButton({ coachId }: { coachId: string }) {
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
        if (!confirm("Удалить тренера из справочника?")) {
          return;
        }
        startTransition(async () => {
          const r = await deleteCoach(coachId);
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
