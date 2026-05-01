"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { addPlayerNoteAction } from "@/lib/actions";
import type { NoteCategory } from "@/lib/types";

const CATEGORIES: { value: NoteCategory; label: string; color: string }[] = [
  { value: "technical", label: "Technik", color: "bg-sky-100 text-sky-900 border-sky-200" },
  { value: "tactical", label: "Taktik", color: "bg-violet-100 text-violet-900 border-violet-200" },
  { value: "physical", label: "Athletik", color: "bg-rose-100 text-rose-900 border-rose-200" },
  { value: "mental", label: "Mental", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
];

export function CommentDialog({
  playerId,
  playerFirstName,
  noteDate,
  trigger,
}: {
  playerId: string;
  playerFirstName: string;
  noteDate: string; // "YYYY-MM-DD" — the training day this comment is about
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<NoteCategory>("technical");
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setCategory("technical");
    setContent("");
  }

  function handleOpen(o: boolean) {
    if (!o) reset();
    setOpen(o);
  }

  function save() {
    const text = content.trim();
    if (!text) {
      toast.error("Kommentar ist leer");
      return;
    }
    startTransition(async () => {
      try {
        await addPlayerNoteAction({
          playerId,
          category,
          content: text,
          noteDate,
        });
        toast.success("Kommentar gespeichert");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger className="block w-full text-left">
        {trigger}
      </SheetTrigger>
      <SheetContent side="bottom" className="flex h-[85dvh] flex-col">
        <SheetHeader>
          <SheetTitle>{playerFirstName} · Kommentar</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Trainingstag: {noteDate.split("-").reverse().join(".")}
          </p>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pt-2">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Dimension
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = c.value === category;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition active:scale-95 ${
                      active
                        ? c.color
                        : "border-muted bg-card text-muted-foreground hover:bg-muted"
                    }`}
                    aria-pressed={active}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Kommentar
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Beobachtung zu diesem Training…"
              className="min-h-32 flex-1 resize-none"
              autoFocus
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={pending}
            className="bg-[var(--clay)] hover:bg-[var(--clay)]/90"
          >
            Speichern
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
