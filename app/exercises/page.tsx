import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Exercise } from "@/lib/types";
import { ExerciseList } from "./exercise-list";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const supabase = await getSupabaseServer();
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("*")
    .order("category")
    .order("name");

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Übungs-Bibliothek
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Übungen</h1>
        </div>
        <Link
          href="/exercises/new"
          className={cn(
            buttonVariants({ size: "sm" }),
            "bg-[var(--clay)] hover:bg-[var(--clay)]/90",
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
        <ExerciseList exercises={(exercises ?? []) as Exercise[]} />
      )}
    </div>
  );
}
