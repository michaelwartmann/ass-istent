"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Check, Plus, Search, Sprout, Trash2, X, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  addExerciseToSpaceAction,
  removeExerciseFromSpaceAction,
  setSpaceExerciseStartedAction,
} from "@/lib/actions";
import { ballBadgeClass, ballLabel, categoryLabel } from "@/lib/format";
import type { BallType, Exercise, ExerciseCategory } from "@/lib/types";

export type SpaceState = "started" | "seed";

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

type Tab = "mein-bestand" | "katalog";

export function ExercisesView({
  exercises,
  space,
}: {
  exercises: Exercise[];
  space: Record<string, SpaceState>;
}) {
  const [tab, setTab] = useState<Tab>("mein-bestand");
  const isEmptySpace = Object.keys(space).length === 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1">
        <TabButton
          active={tab === "mein-bestand"}
          onClick={() => setTab("mein-bestand")}
        >
          Mein Bestand
          <span className="ml-1.5 text-[10px] opacity-70">
            ({Object.keys(space).length})
          </span>
        </TabButton>
        <TabButton active={tab === "katalog"} onClick={() => setTab("katalog")}>
          Katalog
          <span className="ml-1.5 text-[10px] opacity-70">
            ({exercises.length})
          </span>
        </TabButton>
      </div>

      {tab === "mein-bestand" ? (
        <MeinBestand
          exercises={exercises}
          space={space}
          onSwitchToKatalog={() => setTab("katalog")}
          empty={isEmptySpace}
        />
      ) : (
        <Katalog exercises={exercises} space={space} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-lg px-3 text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function MeinBestand({
  exercises,
  space,
  onSwitchToKatalog,
  empty,
}: {
  exercises: Exercise[];
  space: Record<string, SpaceState>;
  onSwitchToKatalog: () => void;
  empty: boolean;
}) {
  const inSpace = exercises.filter((e) => space[e.id]);
  const started = inSpace.filter((e) => space[e.id] === "started");
  const seeds = inSpace.filter((e) => space[e.id] === "seed");

  if (empty) {
    return (
      <div className="space-y-3 rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center">
        <Sprout className="mx-auto h-10 w-10 text-[var(--clay)]" />
        <p className="text-sm font-medium">Dein Bestand ist leer.</p>
        <p className="text-xs text-muted-foreground">
          Lege im Katalog Übungen ab, die du benutzen willst — wie Samen, die
          du dir aussuchst.
        </p>
        <Button
          type="button"
          onClick={onSwitchToKatalog}
          className="bg-[var(--clay)] hover:bg-[var(--clay)]/90"
        >
          Zum Katalog
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Section
        title="Im Einsatz"
        icon={<Zap className="h-3.5 w-3.5 text-[var(--clay)]" />}
        items={started}
        state="started"
        emptyText="Keine aktive Übungen — wähle eine im Plan-Editor, dann landet sie hier."
      />
      <Section
        title="Samen"
        icon={<Sprout className="h-3.5 w-3.5 text-[var(--grass)]" />}
        items={seeds}
        state="seed"
        emptyText="Keine Samen gespeichert. Im Katalog auf + tippen, um Übungen abzulegen."
      />
    </div>
  );
}

function Section({
  title,
  icon,
  items,
  state,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  items: Exercise[];
  state: SpaceState;
  emptyText: string;
}) {
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
        <span className="text-[11px] font-normal opacity-60">
          ({items.length})
        </span>
      </h2>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((ex) => (
            <SpaceCard key={ex.id} exercise={ex} state={state} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SpaceCard({
  exercise,
  state,
}: {
  exercise: Exercise;
  state: SpaceState;
}) {
  const [pending, startTransition] = useTransition();

  function toggleStarted() {
    startTransition(async () => {
      await setSpaceExerciseStartedAction({
        exerciseId: exercise.id,
        started: state !== "started",
      });
    });
  }

  function remove() {
    if (!confirm(`"${exercise.name}" aus dem Bestand entfernen?`)) return;
    startTransition(async () => {
      await removeExerciseFromSpaceAction({ exerciseId: exercise.id });
    });
  }

  return (
    <li
      className={`rounded-md border bg-card p-3 transition-all duration-200 ${
        pending ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <Link
          href={`/exercises/${exercise.id}`}
          className="min-w-0 flex-1 active:scale-[0.99] transition-transform"
        >
          <p className="truncate text-sm font-medium leading-tight">
            {exercise.name}
          </p>
          {exercise.description ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {exercise.description}
            </p>
          ) : null}
        </Link>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant="secondary" className="text-[10px]">
            {categoryLabel(exercise.category)}
          </Badge>
          {exercise.duration_minutes ? (
            <span className="text-[10px] text-muted-foreground">
              {exercise.duration_minutes} min
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleStarted}
          disabled={pending}
          className="h-8 text-[11px]"
        >
          {state === "started" ? (
            <>
              <Sprout className="mr-1 h-3 w-3" />
              Auf Samen setzen
            </>
          ) : (
            <>
              <Zap className="mr-1 h-3 w-3" />
              In Einsatz nehmen
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={remove}
          disabled={pending}
          className="ml-auto h-8 text-[11px] text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Entfernen
        </Button>
      </div>
    </li>
  );
}

function Katalog({
  exercises,
  space,
}: {
  exercises: Exercise[];
  space: Record<string, SpaceState>;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<ExerciseCategory | null>(null);
  const [ball, setBall] = useState<BallType | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (cat && e.category !== cat) return false;
      if (ball && e.ball_type !== ball) return false;
      if (!q) return true;
      const hay =
        `${e.name} ${(e.tags ?? []).join(" ")} ${e.description ?? ""}`.toLowerCase();
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
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors active:scale-[0.96] ${
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
              className={`rounded-full px-2.5 py-1 text-[11px] transition-colors active:scale-[0.96] ${
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
            <CatalogCard key={ex.id} exercise={ex} state={space[ex.id]} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CatalogCard({
  exercise,
  state,
}: {
  exercise: Exercise;
  state: SpaceState | undefined;
}) {
  const [pending, startTransition] = useTransition();
  const inSpace = !!state;

  function add() {
    startTransition(async () => {
      await addExerciseToSpaceAction({
        exerciseId: exercise.id,
        started: false,
      });
    });
  }

  function remove() {
    startTransition(async () => {
      await removeExerciseFromSpaceAction({ exerciseId: exercise.id });
    });
  }

  return (
    <li
      className={`rounded-md border bg-card p-3 transition-all duration-200 ${
        pending ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <Link
          href={`/exercises/${exercise.id}`}
          className="min-w-0 flex-1 active:scale-[0.99] transition-transform"
        >
          <p className="truncate text-sm font-medium leading-tight">
            {exercise.name}
          </p>
          {exercise.description ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {exercise.description}
            </p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className="text-[10px]">
              {categoryLabel(exercise.category)}
            </Badge>
            {exercise.ball_type ? (
              <Badge
                className={`${ballBadgeClass(exercise.ball_type)} border-0 text-[10px]`}
              >
                {ballLabel(exercise.ball_type)}
              </Badge>
            ) : null}
            {exercise.duration_minutes ? (
              <span className="text-[10px] text-muted-foreground">
                ⏱ {exercise.duration_minutes} min
              </span>
            ) : null}
          </div>
        </Link>
        {inSpace ? (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Aus Bestand entfernen"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--clay-soft)] text-[var(--clay)] transition-transform active:scale-[0.92] disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={add}
            disabled={pending}
            aria-label="In Bestand ablegen"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--clay)] text-[var(--clay)] transition-transform active:scale-[0.92] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}
