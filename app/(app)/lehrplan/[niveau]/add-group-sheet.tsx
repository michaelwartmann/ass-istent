"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { setGroupNiveauAction } from "@/lib/actions";
import {
  LEHRPLAN,
  NIVEAU_LABEL,
  type Niveau,
} from "@/lib/lehrplan";
import type { Group } from "@/lib/types";

type Candidate = Pick<Group, "id" | "name" | "location" | "niveau">;

export function AddGroupToNiveauSheet({
  niveau,
  candidates,
}: {
  niveau: Niveau;
  candidates: Candidate[]; // groups currently in *other* niveaus or unassigned
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const target = LEHRPLAN[niveau];

  function assign(group: Candidate) {
    setPendingId(group.id);
    startTransition(async () => {
      try {
        await setGroupNiveauAction({ groupId: group.id, niveau });
        toast.success(`${group.name} → ${target.shortTitle}`);
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-[var(--clay)] hover:bg-muted"
        aria-label="Gruppe zu diesem Niveau hinzufügen"
      >
        <Plus className="h-3.5 w-3.5" />
        Gruppe
      </SheetTrigger>
      <SheetContent side="bottom" className="flex h-[85dvh] flex-col">
        <SheetHeader>
          <SheetTitle>Gruppe zu {target.shortTitle} hinzufügen</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-2 overflow-hidden px-4 pt-2">
          {candidates.length === 0 ? (
            <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
              Alle Gruppen sind bereits diesem Niveau zugeordnet.
            </p>
          ) : (
            <ul className="-mx-2 flex-1 overflow-y-auto px-2">
              {candidates.map((g) => {
                const current = g.niveau;
                const currentLabel = current
                  ? `${NIVEAU_LABEL[current]} · ${LEHRPLAN[current].shortTitle}`
                  : "Nicht zugeordnet";
                const isPending = pendingId === g.id;
                return (
                  <li key={g.id} className="py-1">
                    <button
                      type="button"
                      onClick={() => assign(g)}
                      disabled={isPending}
                      className="flex w-full items-center justify-between gap-2 rounded-md border bg-card p-3 text-left transition active:scale-[0.98] hover:bg-accent disabled:opacity-60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-tight">
                          {g.name}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {g.location}
                          </span>
                          <span>{currentLabel}</span>
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <SheetFooter className="flex-row items-center justify-between gap-2 border-t pt-3">
          <Link
            href="/groups/new"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            <Plus className="h-3 w-3" />
            Neue Gruppe anlegen
          </Link>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pendingId !== null}
          >
            Schließen
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
