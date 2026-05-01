import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import {
  ballBadgeClass,
  ballLabel,
  formatDateLong,
  formatTimeRange,
  initials,
  isoDate,
  parseDate,
} from "@/lib/format";
import type { CalendarDay, Group, Player } from "@/lib/types";
import { CommentDialog } from "@/components/comment-dialog";

export const dynamic = "force-dynamic";

const CAL_LABELS: Record<CalendarDay["type"], string> = {
  feiertag: "Feiertag",
  schulferien: "Schulferien",
  sondertermin: "Sondertermin",
  kein_unterricht: "Kein Unterricht",
};

function isValidIso(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function DayPage(props: PageProps<"/day/[date]">) {
  const coachId = await requireCoachId();
  const { date } = await props.params;
  if (!isValidIso(date)) notFound();

  const day = parseDate(date);
  // JS getDay(): 0=Sun..6=Sat. Map to 1=Mon..7=Sun.
  const isoDow = day.getDay() === 0 ? 7 : day.getDay();

  const supabase = await getSupabaseServer();
  const [{ data: groups }, { data: cal }] = await Promise.all([
    supabase
      .from("groups")
      .select("*")
      .eq("coach_id", coachId)
      .eq("day_of_week", isoDow)
      .order("start_time"),
    supabase
      .from("calendar_days")
      .select("*")
      .eq("coach_id", coachId)
      .eq("date", date)
      .maybeSingle(),
  ]);

  const groupIds = (groups ?? []).map((g) => g.id);
  type GpRow = {
    group_id: string;
    player: Player | Player[] | null;
  };
  let rosters = new Map<string, Player[]>();
  if (groupIds.length) {
    const { data: gp } = await supabase
      .from("group_players")
      .select("group_id, player:players!inner(*)")
      .in("group_id", groupIds)
      .eq("player.coach_id", coachId);
    for (const row of (gp ?? []) as GpRow[]) {
      const p = Array.isArray(row.player) ? row.player[0] : row.player;
      if (!p) continue;
      const list = rosters.get(row.group_id) ?? [];
      list.push(p);
      rosters.set(row.group_id, list);
    }
    rosters = new Map(
      Array.from(rosters.entries()).map(([k, v]) => [
        k,
        v.sort((a, b) => a.first_name.localeCompare(b.first_name, "de")),
      ]),
    );
  }

  const calRow = cal as CalendarDay | null;
  const monday = new Date(day);
  monday.setDate(day.getDate() - ((isoDow + 6) % 7));
  const weekIso = isoDate(monday);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/?week=${weekIso}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Wochenübersicht
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {formatDateLong(day)}
        </h1>
        {calRow ? (
          <p className="mt-1 inline-flex items-center gap-2 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
            <span className="uppercase tracking-wider text-[10px]">
              {CAL_LABELS[calRow.type]}
            </span>
            {calRow.label ? <span>{calRow.label}</span> : null}
          </p>
        ) : null}
      </div>

      {(groups ?? []).length === 0 ? (
        <Card>
          <CardContent className="px-4 py-6 text-center text-sm text-muted-foreground">
            Heute keine Trainingsgruppe.
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {((groups ?? []) as Group[]).map((g) => {
          const players = rosters.get(g.id) ?? [];
          return (
            <section key={g.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/groups/${g.id}`}
                  className="min-w-0 flex-1"
                >
                  <h2 className="truncate font-semibold tracking-tight leading-tight">
                    {g.name}
                  </h2>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{formatTimeRange(g.start_time, g.end_time)}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {g.location}
                    </span>
                  </p>
                </Link>
                {g.ball_type ? (
                  <Badge
                    className={`${ballBadgeClass(g.ball_type)} border-0`}
                  >
                    {ballLabel(g.ball_type)}
                  </Badge>
                ) : null}
              </div>
              {players.length === 0 ? (
                <p className="rounded-md border border-dashed bg-muted/30 px-3 py-3 text-center text-xs text-muted-foreground">
                  Keine Spieler in dieser Gruppe.
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {players.map((p) => (
                    <li key={p.id}>
                      <CommentDialog
                        playerId={p.id}
                        playerFirstName={p.first_name}
                        noteDate={date}
                        trigger={
                          <span className="flex w-full items-center gap-2 rounded-md border bg-card p-2 text-left transition active:scale-[0.97] hover:bg-accent">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-soft text-sm font-semibold">
                              {initials(p)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium leading-tight">
                                {p.first_name}
                              </span>
                              {p.year_of_birth ? (
                                <span className="block text-[11px] text-muted-foreground">
                                  Jg. {p.year_of_birth}
                                </span>
                              ) : null}
                            </span>
                          </span>
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
