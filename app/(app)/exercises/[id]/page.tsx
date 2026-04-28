import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import { ballBadgeClass, ballLabel, categoryLabel } from "@/lib/format";
import type { Exercise } from "@/lib/types";
import { SpaceToggle } from "./space-toggle";

export const dynamic = "force-dynamic";

export default async function ExerciseDetailPage(
  props: PageProps<"/exercises/[id]">,
) {
  const coachId = await requireCoachId();
  const { id } = await props.params;
  const supabase = await getSupabaseServer();

  const [{ data, error }, { data: spaceRow }] = await Promise.all([
    supabase.from("exercises").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("coach_exercises")
      .select("started_at")
      .eq("coach_id", coachId)
      .eq("exercise_id", id)
      .maybeSingle(),
  ]);
  if (error) throw new Error(error.message);
  if (!data) notFound();

  const ex = data as Exercise;
  const inSpace = !!spaceRow;
  const started = !!spaceRow?.started_at;

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/exercises"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Übungen
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight leading-tight">
          {ex.name}
        </h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{categoryLabel(ex.category)}</Badge>
          {ex.ball_type ? (
            <Badge className={`${ballBadgeClass(ex.ball_type)} border-0`}>
              {ballLabel(ex.ball_type)}
            </Badge>
          ) : null}
          {ex.duration_minutes ? (
            <Badge variant="outline">⏱ {ex.duration_minutes} min</Badge>
          ) : null}
          {ex.level ? <Badge variant="outline">Level: {ex.level}</Badge> : null}
          {ex.group_size_min || ex.group_size_max ? (
            <Badge variant="outline">
              Gruppe {ex.group_size_min ?? "?"}–{ex.group_size_max ?? "?"}
            </Badge>
          ) : null}
        </div>
      </div>

      <SpaceToggle
        exerciseId={ex.id}
        inSpace={inSpace}
        started={started}
      />

      {ex.description ? (
        <Card>
          <CardContent className="p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {ex.description}
          </CardContent>
        </Card>
      ) : null}

      {ex.equipment ? (
        <section>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Material
          </p>
          <p className="text-sm">{ex.equipment}</p>
        </section>
      ) : null}

      {ex.tags && ex.tags.length > 0 ? (
        <section className="flex flex-wrap gap-1">
          {ex.tags.map((t) => (
            <Badge key={t} variant="outline" className="text-[10px]">
              #{t}
            </Badge>
          ))}
        </section>
      ) : null}
    </div>
  );
}
