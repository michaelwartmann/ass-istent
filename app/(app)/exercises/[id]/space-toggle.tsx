"use client";

import { useTransition } from "react";
import { Plus, Star, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addExerciseToSpaceAction,
  removeExerciseFromSpaceAction,
  setSpaceExerciseStartedAction,
} from "@/lib/actions";

export function SpaceToggle({
  exerciseId,
  inSpace,
  started,
}: {
  exerciseId: string;
  inSpace: boolean;
  started: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      await addExerciseToSpaceAction({ exerciseId, started: false });
    });
  }
  function remove() {
    startTransition(async () => {
      await removeExerciseFromSpaceAction({ exerciseId });
    });
  }
  function toggleStarted() {
    startTransition(async () => {
      await setSpaceExerciseStartedAction({ exerciseId, started: !started });
    });
  }

  if (!inSpace) {
    return (
      <Button
        type="button"
        onClick={add}
        disabled={pending}
        className="w-full bg-[var(--clay)] hover:bg-[var(--clay)]/90 min-h-[48px] active:scale-[0.98] transition-transform"
      >
        <Plus className="mr-2 h-4 w-4" />
        In meinen Bestand ablegen
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card p-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: started ? "var(--clay-soft)" : "var(--muted)",
          color: started ? "var(--clay)" : "var(--muted-foreground)",
        }}
      >
        {started ? (
          <Zap className="h-4 w-4" />
        ) : (
          <Star className="h-4 w-4 text-amber-500" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {started ? "Im Einsatz" : "Favorit"}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {started
            ? "In aktiver Rotation"
            : "Als Favorit gespeichert"}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleStarted}
        disabled={pending}
        className="h-8 text-[11px]"
      >
        {started ? (
          <>
            <Star className="mr-1 h-3 w-3" />
            Als Favorit
          </>
        ) : (
          <>
            <Zap className="mr-1 h-3 w-3" />
            In Einsatz
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Aus Bestand entfernen"
        onClick={remove}
        disabled={pending}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
