import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSupabaseServer } from "@/lib/supabase/server";
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

export const dynamic = "force-dynamic";

async function load(id: string) {
  const supabase = await getSupabaseServer();
  const weekOf = isoDate(currentWeekMonday());

  const [{ data: group, error: gErr }, { data: players }, { data: exercises }] =
    await Promise.all([
      supabase.from("groups").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("players")
        .select("*")
        .eq("primary_group_id", id)
        .order("first_name"),
      supabase.from("exercises").select("*").order("name"),
    ]);

  if (gErr) throw new Error(gErr.message);
  if (!group) return null;

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

  const exerciseMap = new Map<string, Exercise>(
    ((exercises ?? []) as Exercise[]).map((e) => [e.id, e]),
  );
  const enrichedBlocks = blocks.map((b) => ({
    ...b,
    exercise: b.exercise_id ? (exerciseMap.get(b.exercise_id) ?? null) : null,
  }));

  return {
    group: group as Group,
    players: (players ?? []) as Player[],
    exercises: (exercises ?? []) as Exercise[],
    plan: (plan ?? null) as TrainingPlan | null,
    blocks: enrichedBlocks,
    weekOf,
  };
}

export default async function GroupPage(props: PageProps<"/groups/[id]">) {
  const { id } = await props.params;
  const data = await load(id);
  if (!data) notFound();

  const { group, players, exercises, blocks, weekOf } = data;

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
        <h1 className="mt-1 text-2xl font-semibold tracking-tight leading-tight">
          {group.name}
        </h1>
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
          {group.level ? <span>Level: {group.level}</span> : null}
          {group.age_band ? <span>Alter: {group.age_band}</span> : null}
        </p>
      </div>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Spieler ({players.length})
          </h2>
          <Link
            href={`/players/new?group=${group.id}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-[var(--clay)]",
            )}
          >
            <UserPlus className="mr-1 h-3.5 w-3.5" />
            Neu
          </Link>
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
                  className="flex items-center gap-2 rounded-md border bg-card p-2 transition hover:bg-accent"
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
              exercises={exercises}
            />
          </CardContent>
        </Card>
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
