import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Plus, Users } from "lucide-react";
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
  currentWeekMonday,
  formatDayShort,
  formatTimeRange,
  formatWeekRange,
  isoDate,
  parseDate,
  shiftWeek,
  weekDates,
} from "@/lib/format";
import type { CalendarDay, Group } from "@/lib/types";

export const dynamic = "force-dynamic";

type GroupWithCount = Group & { player_count: number };

async function loadWeek(coachId: string, monday: Date) {
  const supabase = await getSupabaseServer();
  const sunday = weekDates(monday)[6];
  const fromIso = isoDate(monday);
  const toIso = isoDate(sunday);

  const [{ data: groups, error: gErr }, { data: cal }] = await Promise.all([
    supabase
      .from("groups")
      .select("*")
      .eq("coach_id", coachId)
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("calendar_days")
      .select("*")
      .eq("coach_id", coachId)
      .gte("date", fromIso)
      .lte("date", toIso),
  ]);

  if (gErr) {
    return {
      error: gErr.message,
      groups: [] as GroupWithCount[],
      calendar: [] as CalendarDay[],
    };
  }

  const groupIds = (groups ?? []).map((g) => g.id);
  const counts = new Map<string, number>();
  if (groupIds.length) {
    const { data: gp } = await supabase
      .from("group_players")
      .select("group_id")
      .in("group_id", groupIds);
    for (const row of gp ?? []) {
      counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);
    }
  }

  const enriched = ((groups ?? []) as Group[]).map((g) => ({
    ...g,
    player_count: counts.get(g.id) ?? 0,
  }));
  return {
    error: null as string | null,
    groups: enriched,
    calendar: (cal ?? []) as CalendarDay[],
  };
}

export default async function WeekPage(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const weekParam = typeof sp.week === "string" ? sp.week : undefined;
  const monday = weekParam ? parseDate(weekParam) : currentWeekMonday();
  const prev = isoDate(shiftWeek(monday, -1));
  const next = isoDate(shiftWeek(monday, +1));
  const today = isoDate(new Date());

  const coachId = await requireCoachId();
  const { error, groups, calendar } = await loadWeek(coachId, monday);

  const calByDate = new Map<string, CalendarDay>();
  for (const c of calendar) calByDate.set(c.date, c);

  const byDay = new Map<number, GroupWithCount[]>();
  for (const g of groups) {
    const list = byDay.get(g.day_of_week) ?? [];
    list.push(g);
    byDay.set(g.day_of_week, list);
  }
  const dates = weekDates(monday);
  const daysWithGroups = [1, 2, 3, 4, 5, 6, 7].filter((d) => byDay.has(d));

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {weekParam && weekParam !== isoDate(currentWeekMonday())
              ? "Woche"
              : "Diese Woche"}
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

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/?week=${prev}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Vorherige
        </Link>
        {weekParam ? (
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Heute
          </Link>
        ) : (
          <span />
        )}
        <Link
          href={`/?week=${next}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1",
          )}
        >
          Nächste
          <ChevronRight className="h-4 w-4" />
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
              Tipp: Migrationen aus{" "}
              <code className="rounded bg-muted px-1">supabase/migrations/</code>{" "}
              im SQL-Editor ausführen, dann Seed-Skripte.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!error && daysWithGroups.length === 0 ? (
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
        {daysWithGroups.map((d) => {
          const dayDate = dates[d - 1];
          const dayIso = isoDate(dayDate);
          const cal = calByDate.get(dayIso);
          const isToday = dayIso === today;
          return (
            <section key={d} className="space-y-2">
              <h2 className="flex items-baseline justify-between gap-2 px-1">
                <Link
                  href={`/day/${dayIso}`}
                  className="text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  {DAYS_LONG_DE[d - 1]}
                  <span
                    className={cn(
                      "ml-2 normal-case tracking-normal text-foreground/80",
                      isToday && "text-[var(--clay)] font-bold",
                    )}
                  >
                    {formatDayShort(dayDate).split(" ")[1]}
                  </span>
                </Link>
                {cal ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                      cal.type === "feiertag" &&
                        "bg-rose-100 text-rose-900",
                      cal.type === "schulferien" &&
                        "bg-amber-100 text-amber-900",
                      cal.type === "sondertermin" &&
                        "bg-violet-100 text-violet-900",
                      cal.type === "kein_unterricht" &&
                        "bg-slate-100 text-slate-700",
                    )}
                  >
                    {cal.label ?? cal.type}
                  </span>
                ) : null}
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
          );
        })}
      </div>
    </div>
  );
}
