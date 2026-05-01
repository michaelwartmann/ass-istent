import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import { ExerciseForm } from "../../exercise-form";
import type { Exercise } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditExercisePage(
  props: PageProps<"/exercises/[id]/edit">,
) {
  await requireCoachId();
  const { id } = await props.params;

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) notFound();
  const ex = data as Exercise;

  return (
    <div className="space-y-4">
      <Link
        href={`/exercises/${id}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Zurück
      </Link>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {ex.name}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Bearbeiten</h1>
      </div>
      <ExerciseForm mode={{ kind: "edit", exercise: ex }} />
    </div>
  );
}
