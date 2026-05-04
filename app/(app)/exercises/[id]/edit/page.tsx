import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import type { Exercise } from "@/lib/types";
import { ExerciseForm } from "../../exercise-form";

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
      <div>
        <Link
          href={`/exercises/${id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Zur Übung
        </Link>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Übung bearbeiten
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{ex.name}</h1>
      </div>
      <ExerciseForm mode="edit" exercise={ex} />
    </div>
  );
}
