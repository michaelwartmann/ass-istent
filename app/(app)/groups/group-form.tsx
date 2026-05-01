"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createGroupAction,
  deleteGroupAction,
  updateGroupAction,
  type GroupInput,
} from "@/lib/actions";
import type { BallType, Group } from "@/lib/types";
import { DAYS_LONG_DE } from "@/lib/format";

type Mode =
  | { kind: "create" }
  | { kind: "edit"; group: Group };

const BALLS: { value: BallType | "none"; label: string }[] = [
  { value: "none", label: "—" },
  { value: "green", label: "Grün" },
  { value: "orange", label: "Orange" },
  { value: "red", label: "Rot" },
  { value: "hard", label: "Hart" },
];

const LOCATIONS = ["Tennisschule", "TuB Bocholt", "VHS"];

function trimSeconds(t: string | undefined | null): string {
  if (!t) return "";
  // "14:00:00" or "14:00" → "14:00"
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export function GroupForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();

  const init = mode.kind === "edit" ? mode.group : null;
  const [name, setName] = useState(init?.name ?? "");
  const [day, setDay] = useState<number>(init?.day_of_week ?? 3);
  const [start, setStart] = useState(trimSeconds(init?.start_time) || "16:00");
  const [end, setEnd] = useState(trimSeconds(init?.end_time) || "17:00");
  const [location, setLocation] = useState(init?.location ?? "Tennisschule");
  const [ball, setBall] = useState<string>(init?.ball_type ?? "none");
  const [level, setLevel] = useState(init?.level ?? "");
  const [ageBand, setAgeBand] = useState(init?.age_band ?? "");
  const [notes, setNotes] = useState(init?.notes ?? "");

  function buildInput(): GroupInput | null {
    if (!name.trim()) {
      toast.error("Name fehlt");
      return null;
    }
    if (!location.trim()) {
      toast.error("Ort fehlt");
      return null;
    }
    if (!start || !end) {
      toast.error("Zeit fehlt");
      return null;
    }
    return {
      name,
      day_of_week: day,
      start_time: start,
      end_time: end,
      location,
      ball_type:
        ball === "green" || ball === "orange" || ball === "red" || ball === "hard"
          ? ball
          : null,
      level,
      age_band: ageBand,
      notes,
    };
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fields = buildInput();
    if (!fields) return;
    startTransition(async () => {
      try {
        if (mode.kind === "create") {
          const id = await createGroupAction(fields);
          toast.success("Gruppe angelegt");
          router.push(`/groups/${id}`);
        } else {
          await updateGroupAction({ groupId: mode.group.id, fields });
          toast.success("Gruppe gespeichert");
          router.push(`/groups/${mode.group.id}`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function remove() {
    if (mode.kind !== "edit") return;
    if (
      !confirm(
        `"${mode.group.name}" löschen? Die Pläne und Plan-Blöcke dieser Gruppe gehen mit verloren.`,
      )
    ) {
      return;
    }
    startDelete(async () => {
      try {
        await deleteGroupAction({ groupId: mode.group.id });
        toast.success("Gruppe gelöscht");
        router.push("/");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  const busy = pending || deleting;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Mädchengruppe Mi 16:00"
          required
          autoFocus
        />
      </div>

      <div className="space-y-1">
        <Label>Wochentag</Label>
        <Select
          value={String(day)}
          onValueChange={(v) => v && setDay(Number(v))}
        >
          <SelectTrigger>
            <SelectValue>
              {(v: string) => DAYS_LONG_DE[Number(v) - 1] ?? ""}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DAYS_LONG_DE.map((label, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="start">Start</Label>
          <Input
            id="start"
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end">Ende</Label>
          <Input
            id="end"
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="location">Ort *</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Tennisschule, TuB Bocholt, VHS, …"
          list="known-locations"
          required
        />
        <datalist id="known-locations">
          {LOCATIONS.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Ball</Label>
          <Select value={ball} onValueChange={(v) => setBall(v ?? "none")}>
            <SelectTrigger>
              <SelectValue>
                {(v: string) => BALLS.find((b) => b.value === v)?.label ?? ""}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {BALLS.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="level">Niveau</Label>
          <Input
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Anfänger / LK 18 / …"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="age">Altersband</Label>
        <Input
          id="age"
          value={ageBand}
          onChange={(e) => setAgeBand(e.target.value)}
          placeholder="U10 / U14 / Erwachsene / …"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notizen</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Hinweise zur Gruppe (optional)"
          className="min-h-24"
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        {mode.kind === "edit" ? (
          <Button
            type="button"
            variant="ghost"
            onClick={remove}
            disabled={busy}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Löschen
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={busy}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            disabled={busy}
            className="bg-[var(--clay)] hover:bg-[var(--clay)]/90"
          >
            {mode.kind === "edit" ? "Speichern" : "Anlegen"}
          </Button>
        </div>
      </div>
    </form>
  );
}
