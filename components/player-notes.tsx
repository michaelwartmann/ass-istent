"use client";

import { useEffect, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, Mic, MicOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addPlayerNoteAction,
  deletePlayerNoteAction,
} from "@/lib/actions";
import { useDictation } from "@/lib/use-dictation";
import type { NoteCategory, PlayerNote } from "@/lib/types";

const CATEGORIES: { value: NoteCategory; label: string }[] = [
  { value: "technical", label: "Technik" },
  { value: "tactical", label: "Taktik" },
  { value: "physical", label: "Athletik" },
  { value: "mental", label: "Mental" },
];

export function PlayerNotes({
  playerId,
  notes,
}: {
  playerId: string;
  notes: PlayerNote[];
}) {
  const [activeTab, setActiveTab] = useState<NoteCategory>("technical");

  const grouped: Record<NoteCategory, PlayerNote[]> = {
    technical: [],
    tactical: [],
    physical: [],
    mental: [],
  };
  for (const n of notes) grouped[n.category].push(n);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as NoteCategory)}
    >
      <TabsList className="grid w-full grid-cols-4">
        {CATEGORIES.map((c) => (
          <TabsTrigger key={c.value} value={c.value} className="text-xs">
            {c.label}
            {grouped[c.value].length > 0 ? (
              <span className="ml-1 rounded bg-muted px-1 text-[10px]">
                {grouped[c.value].length}
              </span>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
      {CATEGORIES.map((c) => (
        <TabsContent key={c.value} value={c.value} className="mt-3 space-y-2">
          {grouped[c.value].length === 0 ? (
            <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
              Noch keine {c.label}-Notizen.
            </p>
          ) : (
            <ul className="space-y-2">
              {grouped[c.value].map((n) => (
                <NoteItem key={n.id} note={n} playerId={playerId} />
              ))}
            </ul>
          )}
        </TabsContent>
      ))}
      <FloatingAddButton playerId={playerId} defaultCategory={activeTab} />
    </Tabs>
  );
}

function NoteItem({ note, playerId }: { note: PlayerNote; playerId: string }) {
  const [pending, startTransition] = useTransition();
  function remove() {
    if (!confirm("Notiz löschen?")) return;
    startTransition(async () => {
      try {
        await deletePlayerNoteAction({ playerId, noteId: note.id });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }
  return (
    <li className="rounded-md border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {note.content}
        </p>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notiz löschen"
          onClick={remove}
          disabled={pending}
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {format(
          parseISO(note.note_date ?? note.created_at),
          "EEEEEE, d.M.yyyy",
          { locale: de },
        )}
      </p>
    </li>
  );
}

function appendChunk(prev: string, addition: string): string {
  if (!addition) return prev;
  if (!prev) return addition;
  const sep = /[\s\.,!?;:]$/.test(prev) ? "" : " ";
  return `${prev}${sep}${addition}`;
}

function FloatingAddButton({
  playerId,
  defaultCategory,
}: {
  playerId: string;
  defaultCategory: NoteCategory;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<NoteCategory>(defaultCategory);
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  const dictation = useDictation({
    onText: (text) => setContent((prev) => appendChunk(prev, text)),
  });

  useEffect(() => {
    if (open) setCategory(defaultCategory);
  }, [open, defaultCategory]);

  function save() {
    const text = content.trim();
    if (!text) {
      toast.error("Notiz ist leer");
      return;
    }
    startTransition(async () => {
      try {
        await addPlayerNoteAction({ playerId, category, content: text });
        toast.success("Notiz gespeichert");
        setContent("");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && dictation.listening) dictation.stop();
        setOpen(o);
      }}
    >
      <SheetTrigger
        aria-label="Notiz hinzufügen"
        className={cn(
          buttonVariants({ size: "icon" }),
          "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-[var(--clay)] shadow-lg hover:bg-[var(--clay)]/90",
        )}
      >
        <Plus className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85dvh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Neue Notiz</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Kategorie
            </label>
            <Select
              value={category}
              onValueChange={(v) => v && setCategory(v as NoteCategory)}
            >
              <SelectTrigger>
                <SelectValue>
                  {(v: NoteCategory) =>
                    CATEGORIES.find((c) => c.value === v)?.label ?? ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Notiz
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Beobachtung, Coaching-Hinweis…"
              className="min-h-40 flex-1 resize-none"
              autoFocus
            />
            <DictationBar dictation={dictation} />
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

export function DictationBar({
  dictation,
}: {
  dictation: ReturnType<typeof useDictation>;
}) {
  const { supported, listening, pendingChunks, start, stop } = dictation;
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        type="button"
        variant={listening ? "default" : "outline"}
        size="sm"
        onClick={listening ? stop : () => void start()}
        disabled={!supported}
        className={
          listening
            ? "bg-[var(--clay)] text-primary-foreground hover:bg-[var(--clay)]/90"
            : ""
        }
      >
        {listening ? (
          <>
            <MicOff className="mr-1 h-4 w-4 animate-pulse" /> Stopp
          </>
        ) : (
          <>
            <Mic className="mr-1 h-4 w-4" /> Diktieren
          </>
        )}
      </Button>
      {pendingChunks > 0 ? (
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          wird transkribiert…
        </span>
      ) : !supported ? (
        <span className="text-[11px] text-muted-foreground">
          Aufnahme nicht unterstützt
        </span>
      ) : null}
    </div>
  );
}
