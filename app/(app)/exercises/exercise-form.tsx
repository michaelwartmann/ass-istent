"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  createExerciseAction,
  updateExerciseAction,
  type ExerciseInput,
} from "@/lib/actions";
import type { BallType, Exercise, ExerciseCategory } from "@/lib/types";

type Mode =
  | { kind: "create" }
  | { kind: "edit"; exercise: Exercise };

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: "warm_up", label: "Warm-up" },
  { value: "technical", label: "Technik" },
  { value: "physical", label: "Athletik" },
  { value: "tactical", label: "Taktik" },
  { value: "points", label: "Punktspiel" },
  { value: "cool_down", label: "Cool-down" },
];

const BALLS: { value: BallType | "none"; label: string }[] = [
  { value: "none", label: "—" },
  { value: "green", label: "Grün" },
  { value: "orange", label: "Orange" },
  { value: "red", label: "Rot" },
  { value: "hard", label: "Hart" },
];

export function ExerciseForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const init = mode.kind === "edit" ? mode.exercise : null;

  const [name, setName] = useState(init?.name ?? "");
  const [category, setCategory] = useState<ExerciseCategory>(
    init?.category ?? "technical",
  );
  const [description, setDescription] = useState(init?.description ?? "");
  const [duration, setDuration] = useState(
    init?.duration_minutes != null ? String(init.duration_minutes) : "",
  );
  const [ball, setBall] = useState<string>(init?.ball_type ?? "none");
  const [level, setLevel] = useState(init?.level ?? "");
  const [equipment, setEquipment] = useState(init?.equipment ?? "");
  const [tags, setTags] = useState((init?.tags ?? []).join(", "));

  function buildInput(): ExerciseInput | null {
    if (!name.trim()) {
      toast.error("Name fehlt");
      return null;
    }
    return {
      name,
      category,
      description: description || null,
      durationMinutes: duration ? Number(duration) : null,
      ballType:
        ball === "green" ||
        ball === "orange" ||
        ball === "red" ||
        ball === "hard"
          ? (ball as BallType)
          : null,
      level: level || null,
      equipment: equipment || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fields = buildInput();
    if (!fields) return;
    startTransition(async () => {
      try {
        if (mode.kind === "create") {
          const id = await createExerciseAction({
            name: fields.name,
            category: fields.category,
            description: fields.description ?? undefined,
            durationMinutes: fields.durationMinutes ?? undefined,
            ballType: fields.ballType ?? undefined,
            level: fields.level ?? undefined,
            equipment: fields.equipment ?? undefined,
            tags: fields.tags ?? undefined,
          });
          toast.success("Übung gespeichert");
          if (id) router.push(`/exercises/${id}`);
          else router.push("/exercises");
        } else {
          await updateExerciseAction({
            exerciseId: mode.exercise.id,
            fields,
          });
          toast.success("Übung gespeichert");
          router.push(`/exercises/${mode.exercise.id}`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Kategorie *</Label>
          <Select
            value={category}
            onValueChange={(v) => v && setCategory(v as ExerciseCategory)}
          >
            <SelectTrigger>
              <SelectValue />
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
        <div className="space-y-1">
          <Label>Ball</Label>
          <Select value={ball} onValueChange={(v) => setBall(v ?? "none")}>
            <SelectTrigger>
              <SelectValue />
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
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="duration">Dauer (min)</Label>
          <Input
            id="duration"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
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
        <Label htmlFor="description">Beschreibung (Markdown)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-32"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="equipment">Material</Label>
        <Input
          id="equipment"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          placeholder="Hütchen, Bälle, Reifen…"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="tags">Tags (kommasepariert)</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="cross, vh, jugend"
        />
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={pending}
        >
          Abbrechen
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="bg-[var(--clay)] hover:bg-[var(--clay)]/90"
        >
          {mode.kind === "edit" ? "Speichern" : "Anlegen"}
        </Button>
      </div>
    </form>
  );
}
