import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import type { Exercise } from "@/lib/types";
import { ExercisesView, type SpaceState } from "./exercises-view";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();

  const [{ data: exercises, error }, { data: spaceRows }] = await Promise.all([
    supabase
      .from("exercises")
      .select("*")
      .order("category")
      .order("name"),
    supabase
      .from("coach_exercises")
      .select("exercise_id, started_at")
      .eq("coach_id", coachId),
  ]);

  const space: Record<string, SpaceState> = {};
  for (const row of spaceRows ?? []) {
    space[row.exercise_id as string] = row.started_at ? "started" : "seed";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Übungen
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Mein Bestand &amp; Katalog
          </h1>
        </div>
        <Link
          href="/exercises/new"
          className={cn(
            buttonVariants({ size: "sm" }),
            "bg-[var(--clay)] hover:bg-[var(--clay)]/90 active:scale-[0.97] transition-transform",
          )}
        >
          <Plus className="mr-1 h-4 w-4" />
          Neu
        </Link>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error.message}
        </p>
      ) : (
        <ExercisesView
          exercises={(exercises ?? []) as Exercise[]}
          space={space}
        />
      )}
    </div>
  );
}
