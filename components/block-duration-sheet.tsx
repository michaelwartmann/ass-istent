"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { setBlockDurationAction } from "@/lib/actions";

const QUICK_VALUES = [5, 10, 15, 20, 25, 30];

export function BlockDurationSheet({
  groupId,
  blockId,
  blockTitle,
  initialMinutes,
  open,
  onOpenChange,
}: {
  groupId: string;
  blockId: string;
  blockTitle: string;
  initialMinutes: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [value, setValue] = useState<string>(String(initialMinutes ?? 10));
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setValue(String(initialMinutes ?? 10));
  }, [open, initialMinutes]);

  function commit(minutes: number) {
    if (!Number.isFinite(minutes) || minutes < 1) {
      toast.error("Bitte eine Minutenzahl ≥ 1 eingeben.");
      return;
    }
    startTransition(async () => {
      try {
        await setBlockDurationAction({
          groupId,
          blockId,
          durationMinutes: Math.round(minutes),
        });
        onOpenChange(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Dauer konnte nicht gespeichert werden.",
        );
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[60dvh] rounded-t-2xl"
      >
        <SheetHeader>
          <SheetTitle className="pr-8 text-base leading-tight">
            Dauer anpassen
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{blockTitle}</p>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="−5"
              onClick={() => setValue((v) => String(Math.max(1, (Number(v) || 0) - 5)))}
              disabled={pending}
              className="h-10 w-10 text-lg"
            >
              −
            </Button>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-10 flex-1 text-center text-lg font-semibold"
              autoFocus
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="+5"
              onClick={() => setValue((v) => String((Number(v) || 0) + 5))}
              disabled={pending}
              className="h-10 w-10 text-lg"
            >
              +
            </Button>
            <span className="text-sm text-muted-foreground">min</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_VALUES.map((q) => (
              <Button
                key={q}
                variant={String(q) === value ? "default" : "outline"}
                size="sm"
                onClick={() => setValue(String(q))}
                disabled={pending}
              >
                {q} min
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t bg-muted/30 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={pending}>
            Abbrechen
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => commit(Number(value))}
            disabled={pending}
          >
            Speichern
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
