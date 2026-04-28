"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ballBadgeClass, ballLabel, categoryLabel } from "@/lib/format";
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

export function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<ExerciseCategory | null>(null);
  const [ball, setBall] = useState<BallType | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (cat && e.category !== cat) return false;
      if (ball && e.ball_type !== ball) return false;
      if (!q) return true;
      const hay = `${e.name} ${(e.tags ?? []).join(" ")} ${e.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [exercises, query, cat, ball]);

  const hasFilter = !!(query || cat || ball);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Suche nach Name, Tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => {
          const active = cat === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setCat(active ? null : c.value)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                active
                  ? "border-[var(--clay)] bg-[var(--clay)] text-primary-foreground"
                  : "bg-card hover:bg-accent"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {BALLS.map((b) => {
          const active = ball === b.value;
          return (
            <button
              key={b.value}
              type="button"
              onClick={() => setBall(active ? null : b.value)}
              className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                active
                  ? ballBadgeClass(b.value)
                  : "border bg-card hover:bg-accent"
              }`}
            >
              {b.label}
            </button>
          );
        })}
        {hasFilter ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setCat(null);
              setBall(null);
            }}
            className="h-7 px-2 text-[11px]"
          >
            <X className="mr-1 h-3 w-3" /> reset
          </Button>
        ) : null}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {filtered.length} / {exercises.length}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
          Nichts gefunden.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((ex) => (
            <li key={ex.id}>
              <Link
                href={`/exercises/${ex.id}`}
                className="block rounded-md border bg-card p-3 transition hover:bg-accent"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">
                      {ex.name}
                    </p>
                    {ex.description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {ex.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {categoryLabel(ex.category)}
                    </Badge>
                    {ex.ball_type ? (
                      <Badge
                        className={`${ballBadgeClass(ex.ball_type)} border-0 text-[10px]`}
                      >
                        {ballLabel(ex.ball_type)}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                {ex.duration_minutes ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    ⏱ {ex.duration_minutes} min
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
