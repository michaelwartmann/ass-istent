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
} from "@/lib/actions";
import type { BallType, Exercise, ExerciseCategory } from "@/lib/types";

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: "warm_up", label: "Warm-up" },
  { value: "technical", label: "Technik" },
  { value: "physical", label: "Athletik" },
  { value: "tactical", label: "Taktik" },
  { value: "points", label: "Punktspiel" },
  { value: "cool_down", label: "Cool-down" },
];

const BALLS: { value: BallType; label: string }[] = [
  { value: "green", label: "Grün" },
  { value: "orange", label: "Orange" },
  { value: "red", label: "Rot" },
  { value: "hard", label: "Hart" },
];

type Props =
  | { mode: "create"; exercise?: undefined }
  | { mode: "edit"; exercise: Exercise };

export function ExerciseForm(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const initial = props.exercise;
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<ExerciseCategory>(
    initial?.category ?? "technical",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(
    initial?.duration_minutes != null ? String(initial.duration_minutes) : "",
  );
  const [ball, setBall] = useState<string>(initial?.ball_type ?? "none");
  const [level, setLevel] = useState(initial?.level ?? "");
  const [groupMin, setGroupMin] = useState(
    initial?.group_size_min != null ? String(initial.group_size_min) : "",
  );
  const [groupMax, setGroupMax] = useState(
    initial?.group_size_max != null ? String(initial.group_size_max) : "",
  );
  const [equipment, setEquipment] = useState(initial?.equipment ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? "");

  function ballOrUndefined(): BallType | undefined {
    return ball === "green" || ball === "orange" || ball === "red" || ball === "hard"
      ? ball
      : undefined;
  }

  function tagsArray(): string[] {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name fehlt");
      return;
    }
    startTransition(async () => {
      try {
        if (props.mode === "create") {
          const id = await createExerciseAction({
            name: name.trim(),
            category,
            description: description.trim() || undefined,
            durationMinutes: duration ? Number(duration) : undefined,
            ballType: ballOrUndefined(),
            level: level.trim() || undefined,
            groupSizeMin: groupMin ? Number(groupMin) : undefined,
            groupSizeMax: groupMax ? Number(groupMax) : undefined,
            equipment: equipment.trim() || undefined,
            tags: tagsArray(),
            videoUrl: videoUrl.trim() || undefined,
          });
          toast.success("Übung gespeichert");
          if (id) router.push(`/exercises/${id}`);
          else router.push("/exercises");
        } else {
          await updateExerciseAction({
            exerciseId: props.exercise.id,
            fields: {
              name: name.trim(),
              category,
              description: description.trim() || null,
              duration_minutes: duration ? Number(duration) : null,
              ball_type: ballOrUndefined() ?? null,
              level: level.trim() || null,
              group_size_min: groupMin ? Number(groupMin) : null,
              group_size_max: groupMax ? Number(groupMax) : null,
              equipment: equipment.trim() || null,
              tags: tagsArray().length ? tagsArray() : null,
              video_url: videoUrl.trim() || null,
            },
          });
          toast.success("Übung aktualisiert");
          router.push(`/exercises/${props.exercise.id}`);
          router.refresh();
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
          autoFocus={props.mode === "create"}
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
              <SelectValue>
                {(v) => CATEGORIES.find((c) => c.value === v)?.label ?? ""}
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
        <div className="space-y-1">
          <Label>Ball</Label>
          <Select value={ball} onValueChange={(v) => setBall(v ?? "none")}>
            <SelectTrigger>
              <SelectValue>
                {(v) =>
                  v === "none" || !v
                    ? "—"
                    : BALLS.find((b) => b.value === v)?.label ?? ""
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
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
          <Label htmlFor="level">Level</Label>
          <Input
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Erwachsene / LK 18 / …"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="groupMin">Gruppe min</Label>
          <Input
            id="groupMin"
            inputMode="numeric"
            value={groupMin}
            onChange={(e) => setGroupMin(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="groupMax">Gruppe max</Label>
          <Input
            id="groupMax"
            inputMode="numeric"
            value={groupMax}
            onChange={(e) => setGroupMax(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Beschreibung</Label>
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
      <div className="space-y-1">
        <Label htmlFor="videoUrl">Video-URL</Label>
        <Input
          id="videoUrl"
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
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
          {props.mode === "create" ? "Speichern" : "Aktualisieren"}
        </Button>
      </div>
    </form>
  );
}
