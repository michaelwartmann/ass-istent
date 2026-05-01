import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import {
  DAYS_LONG_DE,
  ballBadgeClass,
  ballLabel,
  formatTimeRange,
  initials,
  formatPlayerName,
  isoDate,
  currentWeekMonday,
} from "@/lib/format";
import type {
  Exercise,
  Group,
  PlanBlock,
  Player,
  TrainingPlan,
} from "@/lib/types";
import { PlanEditor } from "@/components/plan-editor";
import { AddPlayerSheet } from "./add-player-sheet";

export const dynamic = "force-dynamic";

async function load(id: string, coachId: string) {
  const supabase = await getSupabaseServer();
  const weekOf = isoDate(currentWeekMonday());

  const [
    { data: group, error: gErr },
    { data: gpRows },
    { data: allCoachPlayers },
    { data: spaceRows },
  ] = await Promise.all([
    supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .eq("coach_id", coachId)
      .maybeSingle(),
    supabase
      .from("group_players")
      .select("player_id, player:players!inner(*)")
      .eq("group_id", id)
      .eq("player.coach_id", coachId),
    supabase
      .from("players")
      .select("id, first_name, last_name, year_of_birth")
      .eq("coach_id", coachId)
      .order("first_name"),
    // Coach's exercise space — only exercises in the coach's space are
    // assignable to plan blocks.
    supabase
      .from("coach_exercises")
      .select("exercise_id, started_at, exercise:exercises(*)")
      .eq("coach_id", coachId),
  ]);

  if (gErr) throw new Error(gErr.message);
  if (!group) return null;

  type GpRow = {
    player_id: string;
    player: Player | Player[] | null;
  };
  const players: Player[] = ((gpRows ?? []) as GpRow[])
    .map((r) => (Array.isArray(r.player) ? (r.player[0] ?? null) : r.player))
    .filter((p): p is Player => !!p)
    .sort((a, b) => a.first_name.localeCompare(b.first_name, "de"));

  const inGroupIds = new Set(players.map((p) => p.id));
  const candidates = (allCoachPlayers ?? []).filter(
    (p) => !inGroupIds.has(p.id),
  );

  const spaceExercises: Exercise[] = (
    (spaceRows ?? []) as Array<{
      exercise: Exercise | Exercise[] | null;
    }>
  )
    .map((r) =>
      Array.isArray(r.exercise) ? (r.exercise[0] ?? null) : r.exercise,
    )
    .filter((e): e is Exercise => !!e)
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  const { data: plan } = await supabase
    .from("training_plans")
    .select("*")
    .eq("group_id", id)
    .eq("week_of", weekOf)
    .maybeSingle();

  let blocks: PlanBlock[] = [];
  if (plan) {
    const { data: blockRows } = await supabase
      .from("plan_blocks")
      .select("*")
      .eq("plan_id", plan.id)
      .order("order_index");
    blocks = (blockRows ?? []) as PlanBlock[];
  }

  // For block enrichment we need the exercise even if it's not (or no
  // longer) in the coach's space, so blocks render correctly.
  const exerciseMap = new Map<string, Exercise>(
    spaceExercises.map((e) => [e.id, e]),
  );
  const missingIds = blocks
    .map((b) => b.exercise_id)
    .filter((eid): eid is string => !!eid && !exerciseMap.has(eid));
  if (missingIds.length > 0) {
    const { data: extra } = await supabase
      .from("exercises")
      .select("*")
      .in("id", missingIds);
    for (const e of (extra ?? []) as Exercise[]) {
      exerciseMap.set(e.id, e);
    }
  }
  const enrichedBlocks = blocks.map((b) => ({
    ...b,
    exercise: b.exercise_id ? (exerciseMap.get(b.exercise_id) ?? null) : null,
  }));

  return {
    group: group as Group,
    players,
    candidates,
    spaceExercises,
    plan: (plan ?? null) as TrainingPlan | null,
    blocks: enrichedBlocks,
    weekOf,
  };
}

export default async function GroupPage(props: PageProps<"/groups/[id]">) {
  const coachId = await requireCoachId();
  const { id } = await props.params;
  const data = await load(id, coachId);
  if (!data) notFound();

  const { group, players, candidates, spaceExercises, blocks, weekOf } = data;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Wochenplan
        </Link>
        <div className="mt-1 flex items-start gap-2">
          <h1 className="flex-1 text-2xl font-semibold tracking-tight leading-tight">
            {group.name}
          </h1>
          <Link
            href={`/groups/${group.id}/edit`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "shrink-0 text-muted-foreground hover:text-[var(--clay)]",
            )}
            aria-label="Gruppe bearbeiten"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{DAYS_LONG_DE[group.day_of_week - 1]}</span>
          <span>{formatTimeRange(group.start_time, group.end_time)}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {group.location}
          </span>
          {group.ball_type ? (
            <Badge className={`${ballBadgeClass(group.ball_type)} border-0`}>
              {ballLabel(group.ball_type)}
            </Badge>
          ) : null}
          {group.level ? <span>Niveau: {group.level}</span> : null}
          {group.age_band ? <span>Alter: {group.age_band}</span> : null}
        </p>
      </div>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Spieler ({players.length})
          </h2>
          <AddPlayerSheet groupId={group.id} candidates={candidates} />
        </div>
        {players.length === 0 ? (
          <p className="rounded-md border border-dashed bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
            Noch keine Spieler in dieser Gruppe.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {players.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/players/${p.id}`}
                  className="flex items-center gap-2 rounded-md border bg-card p-2 transition-all duration-200 active:scale-[0.97] hover:bg-accent"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-soft text-sm font-semibold">
                    {initials(p)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium leading-tight">
                      {formatPlayerName(p)}
                    </span>
                    {p.year_of_birth ? (
                      <span className="block text-[11px] text-muted-foreground">
                        Jg. {p.year_of_birth}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Plan dieser Woche
          </h2>
          <span className="text-[11px] text-muted-foreground">
            ab {weekOf.split("-").reverse().join(".")}
          </span>
        </div>
        <Card>
          <CardContent className="p-3">
            <PlanEditor
              groupId={group.id}
              weekOf={weekOf}
              blocks={blocks}
              exercises={spaceExercises}
            />
          </CardContent>
        </Card>
        {spaceExercises.length === 0 ? (
          <p className="rounded-md border border-dashed bg-muted/30 px-3 py-3 text-center text-xs text-muted-foreground">
            Dein Übungs-Bestand ist leer. Lege im{" "}
            <Link href="/exercises" className="text-[var(--clay)] underline">
              Katalog
            </Link>{" "}
            Übungen ab, um sie im Plan auswählen zu können.
          </p>
        ) : null}
      </section>

      {group.notes ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Notizen
          </h2>
          <Card>
            <CardContent className="p-4 text-sm whitespace-pre-wrap">
              {group.notes}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
