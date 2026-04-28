import Link from "next/link";
import { MapPin, Plus, Users } from "lucide-react";
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
  formatWeekRange,
  currentWeekMonday,
} from "@/lib/format";
import type { Group } from "@/lib/types";

export const dynamic = "force-dynamic";

type GroupWithCount = Group & { player_count: number };

async function loadWeek(coachId: string) {
  const supabase = await getSupabaseServer();
  const [{ data: groups, error }, { data: players }] = await Promise.all([
    supabase
      .from("groups")
      .select("*")
      .eq("coach_id", coachId)
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("players")
      .select("primary_group_id")
      .eq("coach_id", coachId),
  ]);

  if (error) {
    return { error: error.message, groups: [] as GroupWithCount[] };
  }

  const counts = new Map<string, number>();
  for (const p of players ?? []) {
    if (!p.primary_group_id) continue;
    counts.set(p.primary_group_id, (counts.get(p.primary_group_id) ?? 0) + 1);
  }

  const enriched = ((groups ?? []) as Group[]).map((g) => ({
    ...g,
    player_count: counts.get(g.id) ?? 0,
  }));
  return { error: null as string | null, groups: enriched };
}

export default async function WeekPage() {
  const coachId = await requireCoachId();
  const { error, groups } = await loadWeek(coachId);
  const monday = currentWeekMonday();

  const byDay = new Map<number, GroupWithCount[]>();
  for (const g of groups) {
    const list = byDay.get(g.day_of_week) ?? [];
    list.push(g);
    byDay.set(g.day_of_week, list);
  }
  const days = [1, 2, 3, 4, 5, 6, 7].filter((d) => byDay.has(d));

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Diese Woche
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {formatWeekRange(monday)}
          </h1>
        </div>
        <Link
          href="/groups/new"
          className={cn(
            buttonVariants({ size: "sm" }),
            "bg-[var(--clay)] hover:bg-[var(--clay)]/90",
          )}
        >
          <Plus className="mr-1 h-4 w-4" />
          Gruppe
        </Link>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="font-semibold text-destructive">
              Konnte Gruppen nicht laden
            </p>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-muted-foreground">
              Tipp: Migration aus{" "}
              <code className="rounded bg-muted px-1">
                supabase/migrations/0001_multi_coach.sql
              </code>{" "}
              im SQL-Editor ausführen, dann{" "}
              <code className="rounded bg-muted px-1">
                npx tsx scripts/seed.ts
              </code>
              .
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!error && days.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-6 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Noch keine Gruppen.</p>
            <p>
              Lege deine erste Trainingsgruppe an, um den Wochenplan zu
              befüllen.
            </p>
            <Link
              href="/groups/new"
              className={cn(
                buttonVariants({ size: "default" }),
                "bg-[var(--clay)] hover:bg-[var(--clay)]/90",
              )}
            >
              <Plus className="mr-1 h-4 w-4" />
              Erste Gruppe anlegen
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-5">
        {days.map((d) => (
          <section key={d} className="space-y-2">
            <h2 className="px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {DAYS_LONG_DE[d - 1]}
            </h2>
            <ul className="space-y-2">
              {byDay.get(d)!.map((g) => (
                <li key={g.id}>
                  <Link href={`/groups/${g.id}`} className="block">
                    <Card className="transition-all duration-200 active:scale-[0.98] hover:shadow-md">
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex w-16 flex-col items-center justify-center rounded-md bg-clay-soft py-2 text-center">
                          <span className="text-base font-semibold text-foreground">
                            {g.start_time.slice(0, 5)}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {g.end_time.slice(0, 5)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium leading-tight">
                            {g.name}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {g.location}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {g.player_count}
                            </span>
                            <span className="inline-flex items-center">
                              {formatTimeRange(g.start_time, g.end_time)}
                            </span>
                          </p>
                        </div>
                        {g.ball_type ? (
                          <Badge
                            className={`${ballBadgeClass(g.ball_type)} border-0`}
                          >
                            {ballLabel(g.ball_type)}
                          </Badge>
                        ) : null}
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
