"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  addPlayerToGroupAction,
  createPlayerAction,
} from "@/lib/actions";
import type { Player } from "@/lib/types";

type Pickable = Pick<Player, "id" | "first_name" | "last_name" | "year_of_birth">;

export function AddPlayerSheet({
  groupId,
  candidates,
}: {
  groupId: string;
  candidates: Pickable[]; // all coach's players NOT yet in this group
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"pick" | "create">(
    candidates.length > 0 ? "pick" : "create",
  );
  const [query, setQuery] = useState("");
  const [first, setFirst] = useState("");
  const [yob, setYob] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setQuery("");
    setFirst("");
    setYob("");
    setMode(candidates.length > 0 ? "pick" : "create");
  }

  function handleOpen(o: boolean) {
    if (!o) reset();
    setOpen(o);
  }

  function pick(player: Pickable) {
    startTransition(async () => {
      try {
        await addPlayerToGroupAction({ playerId: player.id, groupId });
        toast.success(`${player.first_name} zur Gruppe hinzugefügt`);
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function createAndAdd() {
    if (!first.trim()) {
      toast.error("Vorname fehlt");
      return;
    }
    startTransition(async () => {
      try {
        const id = await createPlayerAction({
          firstName: first.trim(),
          yearOfBirth: yob ? Number(yob) : null,
          primaryGroupId: groupId,
        });
        toast.success(`${first.trim()} angelegt`);
        if (id) {
          // createPlayerAction already inserts the group_players row, so no
          // need to add again.
        }
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  const filtered = candidates.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.first_name.toLowerCase().includes(q) ||
      (p.last_name?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-[var(--clay)] hover:bg-muted"
        aria-label="Spieler hinzufügen"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Spieler
      </SheetTrigger>
      <SheetContent side="bottom" className="flex h-[85dvh] flex-col">
        <SheetHeader>
          <SheetTitle>Spieler hinzufügen</SheetTitle>
        </SheetHeader>

        <div className="flex gap-1 px-4">
          <Button
            type="button"
            variant={mode === "pick" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("pick")}
            disabled={candidates.length === 0}
            className={
              mode === "pick"
                ? "bg-[var(--clay)] hover:bg-[var(--clay)]/90"
                : ""
            }
          >
            Aus Bestand
          </Button>
          <Button
            type="button"
            variant={mode === "create" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("create")}
            className={
              mode === "create"
                ? "bg-[var(--clay)] hover:bg-[var(--clay)]/90"
                : ""
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Neu
          </Button>
        </div>

        {mode === "pick" ? (
          <div className="flex flex-1 flex-col gap-2 overflow-hidden px-4 pt-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nach Vornamen suchen…"
                className="pl-9"
                autoFocus
              />
            </div>
            <ul className="-mx-2 flex-1 overflow-y-auto px-2">
              {filtered.length === 0 ? (
                <li className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
                  {query
                    ? "Keine Treffer."
                    : "Keine weiteren Spieler im Bestand."}
                </li>
              ) : (
                filtered.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => pick(p)}
                      disabled={pending}
                      className="flex w-full items-center gap-2 rounded-md border bg-card p-2 text-left transition active:scale-[0.97] hover:bg-accent"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-soft text-sm font-semibold">
                        {(p.first_name[0] ?? "?").toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium leading-tight">
                          {p.first_name}
                        </span>
                        {p.year_of_birth ? (
                          <span className="block text-[11px] text-muted-foreground">
                            Jg. {p.year_of_birth}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="cf">Vorname *</Label>
              <Input
                id="cf"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cy">Jahrgang</Label>
              <Input
                id="cy"
                inputMode="numeric"
                placeholder="z.B. 2014"
                value={yob}
                onChange={(e) => setYob(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Weitere Felder (Hand, Lernziele, …) auf der Spielerseite ergänzen.
            </p>
          </div>
        )}

        <SheetFooter className="flex-row justify-end gap-2 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Abbrechen
          </Button>
          {mode === "create" ? (
            <Button
              type="button"
              onClick={createAndAdd}
              disabled={pending}
              className="bg-[var(--clay)] hover:bg-[var(--clay)]/90"
            >
              Anlegen & hinzufügen
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
