"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categoryLabel } from "@/lib/format";
import type { Exercise, ExerciseCategory } from "@/lib/types";
import { setBlockExerciseAction } from "@/lib/actions";

export function ExercisePicker({
  groupId,
  blockId,
  blockType,
  trigger,
  exercises,
}: {
  groupId: string;
  blockId: string;
  blockType: ExerciseCategory;
  trigger: React.ReactElement;
  exercises: Exercise[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchType = exercises.filter((e) => e.category === blockType);
    const others = exercises.filter((e) => e.category !== blockType);
    const all = [...matchType, ...others];
    if (!q) return all;
    return all.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q),
    );
  }, [exercises, blockType, query]);

  function pick(ex: Exercise | null) {
    startTransition(async () => {
      await setBlockExerciseAction({
        groupId,
        blockId,
        exerciseId: ex?.id ?? null,
        durationMinutes: ex?.duration_minutes ?? null,
      });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85dvh] overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="px-4 pb-2 pt-4">
          <DialogTitle>Übung wählen</DialogTitle>
        </DialogHeader>
        <div className="border-b px-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Suche…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-[55dvh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Keine passenden Übungen.
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((ex) => (
                <li key={ex.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => pick(ex)}
                    className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left transition hover:bg-accent disabled:opacity-60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{ex.name}</p>
                      {ex.description ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {ex.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {categoryLabel(ex.category)}
                      </Badge>
                      {ex.duration_minutes ? (
                        <span className="text-[10px] text-muted-foreground">
                          {ex.duration_minutes} min
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => pick(null)}
            disabled={pending}
          >
            Übung entfernen
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
