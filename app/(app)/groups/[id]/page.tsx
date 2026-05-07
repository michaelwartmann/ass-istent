import Link from "next/link";
import { notFound } from "next/navigation";
import { addDays, getISOWeek, parseISO } from "date-fns";
import {
  ArrowLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pencil,
} from "lucide-react";
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
  formatDayShort,
  formatPlayerName,
  formatTimeRange,
  initials,
  isoDate,
  currentWeekMonday,
  shiftWeek,
} from "@/lib/format";
import type {
  AttendanceStatus,
  Exercise,
  Group,
  PlanBlock,
  Player,
  TrainingPlan,
} from "@/lib/types";
import { PlanEditor } from "@/components/plan-editor";
import { GroupAttendanceList } from "@/components/group-attendance-list";
import { AddPlayerSheet } from "./add-player-sheet";

export const dynamic = "force-dynamic";

function lessonMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh || 0) * 60 + (em || 0) - ((sh || 0) * 60 + (sm || 0));
}

function lessonDateForWeek(monday: Date, dayOfWeek: number): string {
  return isoDate(addDays(monday, Math.max(0, dayOfWeek - 1)));
}

function todayBerlinIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function resolveMonday(weekParam: string | undefined): Date {
  if (!weekParam || !ISO_DATE.test(weekParam)) return currentWeekMonday();
  const parsed = parseISO(weekParam);
  if (Number.isNaN(parsed.getTime())) return currentWeekMonday();
  // Snap to Monday of that week — defensive against ?week=Wed-of-some-week.
  return currentWeekMonday(parsed);
}

async function load(id: string, coachId: string, monday: Date) {
  const supabase = await getSupabaseServer();
  const weekOf = isoDate(monday);

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

  // Attendance for the lesson date in the week being viewed.
  const today = todayBerlinIso();
  const sessionDate = lessonDateForWeek(monday, (group as Group).day_of_week);
  const isFutureSession = sessionDate > today;

  const initialAttendance: Record<string, AttendanceStatus> = {};
  let initialCancelled = false;
  if (!isFutureSession) {
    const { data: session } = await supabase
      .from("lesson_sessions")
      .select("id, cancelled")
      .eq("group_id", id)
      .eq("session_date", sessionDate)
      .maybeSingle();
    if (session) {
      initialCancelled = !!session.cancelled;
      const { data: rows } = await supabase
        .from("attendance")
        .select("player_id, status")
        .eq("session_id", session.id);
      for (const r of rows ?? []) {
        initialAttendance[r.player_id as string] =
          r.status as AttendanceStatus;
      }
    }
  }

  return {
    group: group as Group,
    players,
    candidates,
    spaceExercises,
    plan: (plan ?? null) as TrainingPlan | null,
    blocks: enrichedBlocks,
    weekOf,
    sessionDate,
    initialAttendance,
    initialCancelled,
    isFutureSession,
  };
}

export default async function GroupPage(props: PageProps<"/groups/[id]">) {
  const coachId = await requireCoachId();
  const { id } = await props.params;
  const sp = await props.searchParams;
  const weekParam = typeof sp.week === "string" ? sp.week : undefined;
  const monday = resolveMonday(weekParam);
  const isCurrentWeek = isoDate(monday) === isoDate(currentWeekMonday());
  const prevWeekIso = isoDate(shiftWeek(monday, -1));
  const nextWeekIso = isoDate(shiftWeek(monday, +1));
  const data = await load(id, coachId, monday);
  if (!data) notFound();

  const {
    group,
    players,
    candidates,
    spaceExercises,
    blocks,
    weekOf,
    sessionDate,
    initialAttendance,
    initialCancelled,
    isFutureSession,
  } = data;
  const weekLabel = isCurrentWeek
    ? "Plan dieser Woche"
    : `Plan KW ${getISOWeek(monday)}`;
  const wochenplanHref = isCurrentWeek ? "/" : `/?week=${weekOf}`;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={wochenplanHref}
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
            href={`/groups/${group.id}/report`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "shrink-0 text-muted-foreground hover:text-[var(--clay)]",
            )}
            aria-label="Bericht ansehen"
          >
            <BarChart3 className="h-4 w-4" />
          </Link>
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
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {isFutureSession ? "Spieler" : "Anwesenheit"} ·{" "}
            {formatDayShort(parseISO(sessionDate))} ({players.length})
          </h2>
          <AddPlayerSheet groupId={group.id} candidates={candidates} />
        </div>
        {isFutureSession ? (
          players.length === 0 ? (
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
          )
        ) : (
          <GroupAttendanceList
            groupId={group.id}
            players={players}
            sessionDate={sessionDate}
            initialAttendance={initialAttendance}
            initialCancelled={initialCancelled}
          />
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {weekLabel}
          </h2>
          <span className="text-[11px] text-muted-foreground">
            ab {weekOf.split("-").reverse().join(".")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/groups/${group.id}?week=${prevWeekIso}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Vorherige
          </Link>
          {!isCurrentWeek ? (
            <Link
              href={`/groups/${group.id}`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Heute
            </Link>
          ) : (
            <span />
          )}
          <Link
            href={`/groups/${group.id}?week=${nextWeekIso}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1",
            )}
          >
            Nächste
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <Card>
          <CardContent className="p-3">
            <PlanEditor
              groupId={group.id}
              weekOf={weekOf}
              blocks={blocks}
              exercises={spaceExercises}
              lessonMinutes={lessonMinutes(group.start_time, group.end_time)}
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
