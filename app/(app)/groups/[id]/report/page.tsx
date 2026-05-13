import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseServer } from "@/lib/supabase/server";
import { currentReadCoachId } from "@/lib/currentCoach";
import {
  DAYS_LONG_DE,
  formatPlayerName,
  formatTimeRange,
  initials,
} from "@/lib/format";
import type {
  AttendanceStatus,
  Group,
  NoteCategory,
  Player,
  PlayerNote,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NOTE_LABEL: Record<NoteCategory, string> = {
  technical: "Technik",
  tactical: "Taktik",
  physical: "Athletik",
  mental: "Mental",
};

type SessionRow = {
  id: string;
  session_date: string;
  cancelled: boolean;
};

type AttendanceRow = {
  session_id: string;
  player_id: string;
  status: AttendanceStatus;
};

type PlayerStats = {
  player: Player;
  present: number;
  excused: number;
  absent: number;
  total: number;
  rate: number;
  lastAbsence: string | null;
};

async function load(id: string, coachId: string) {
  const supabase = await getSupabaseServer();

  const [
    { data: group, error: gErr },
    { data: gpRows },
    { data: sessionRows },
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
      .from("lesson_sessions")
      .select("id, session_date, cancelled")
      .eq("group_id", id)
      .order("session_date", { ascending: false }),
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

  const sessions: SessionRow[] = (sessionRows ?? []) as SessionRow[];
  const sessionIds = sessions.map((s) => s.id);

  let attendance: AttendanceRow[] = [];
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from("attendance")
      .select("session_id, player_id, status")
      .in("session_id", sessionIds);
    attendance = (data ?? []) as AttendanceRow[];
  }

  const playerIds = players.map((p) => p.id);
  let notes: PlayerNote[] = [];
  if (playerIds.length > 0) {
    const { data } = await supabase
      .from("player_notes")
      .select("*")
      .in("player_id", playerIds)
      .order("note_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    notes = (data ?? []) as PlayerNote[];
  }

  return { group: group as Group, players, sessions, attendance, notes };
}

export default async function GroupReportPage(
  props: PageProps<"/groups/[id]/report">,
) {
  const coachId = await currentReadCoachId();
  const { id } = await props.params;
  const data = await load(id, coachId);
  if (!data) notFound();

  const { group, players, sessions, attendance, notes } = data;

  // Index attendance: session_id -> player_id -> status
  const byPlayer: Record<string, Record<string, AttendanceStatus>> = {};
  for (const a of attendance) {
    (byPlayer[a.player_id] ??= {})[a.session_id] = a.status;
  }

  const activeSessions = sessions.filter((s) => !s.cancelled);
  // Denominator counts only non-cancelled sessions where at least one
  // attendance row exists. A "forgot to mark anyone" lesson does not
  // tank everyone's rate — see lib/actions.ts comment.
  const sessionsWithMarks = new Set(attendance.map((a) => a.session_id));
  const recordedSessions = activeSessions.filter((s) =>
    sessionsWithMarks.has(s.id),
  );

  const stats: PlayerStats[] = players.map((p) => {
    let present = 0,
      excused = 0,
      absent = 0;
    let lastAbsence: string | null = null;
    for (const s of recordedSessions) {
      const status = byPlayer[p.id]?.[s.id];
      if (status === "present") present += 1;
      else if (status === "excused") {
        excused += 1;
        if (!lastAbsence || s.session_date > lastAbsence)
          lastAbsence = s.session_date;
      } else if (status === "absent") {
        absent += 1;
        if (!lastAbsence || s.session_date > lastAbsence)
          lastAbsence = s.session_date;
      }
    }
    const total = present + excused + absent;
    const rate = total === 0 ? 0 : Math.round((present / total) * 100);
    return { player: p, present, excused, absent, total, rate, lastAbsence };
  });
  stats.sort((a, b) => {
    if (a.total === 0 && b.total === 0)
      return a.player.first_name.localeCompare(b.player.first_name, "de");
    if (a.total === 0) return 1;
    if (b.total === 0) return -1;
    return a.rate - b.rate;
  });

  const lastEight = activeSessions.slice(0, 8);

  const notesByPlayer: Record<string, PlayerNote[]> = {};
  for (const n of notes) {
    (notesByPlayer[n.player_id] ??= []).push(n);
  }

  const totalRecorded = recordedSessions.length;
  const totalCancelled = sessions.filter((s) => s.cancelled).length;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/groups/${group.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Gruppe
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight leading-tight">
          {group.name} · Bericht
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Anwesenheit in dieser Gruppe ·{" "}
          {DAYS_LONG_DE[group.day_of_week - 1]}{" "}
          {formatTimeRange(group.start_time, group.end_time)} ·{" "}
          {totalRecorded} erfasste Stunden
          {totalCancelled > 0 ? ` · ${totalCancelled} abgesagt` : ""}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Übersicht
        </h2>
        {stats.length === 0 ? (
          <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
            Noch keine Spieler.
          </p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Spieler</th>
                      <th className="px-2 py-2 text-center font-medium">✓</th>
                      <th className="px-2 py-2 text-center font-medium">E</th>
                      <th className="px-2 py-2 text-center font-medium">✗</th>
                      <th className="px-2 py-2 text-right font-medium">Quote</th>
                      <th className="px-3 py-2 text-right font-medium">
                        Zuletzt gefehlt
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((s) => (
                      <tr key={s.player.id} className="border-b last:border-b-0">
                        <td className="px-3 py-2">
                          <Link
                            href={`/players/${s.player.id}`}
                            className="font-medium hover:underline"
                          >
                            {formatPlayerName(s.player)}
                          </Link>
                        </td>
                        <td className="px-2 py-2 text-center text-emerald-700">
                          {s.present || "–"}
                        </td>
                        <td className="px-2 py-2 text-center text-amber-700">
                          {s.excused || "–"}
                        </td>
                        <td className="px-2 py-2 text-center text-rose-700">
                          {s.absent || "–"}
                        </td>
                        <td
                          className={cn(
                            "px-2 py-2 text-right font-semibold tabular-nums",
                            s.total === 0
                              ? "text-muted-foreground"
                              : s.rate >= 80
                                ? "text-emerald-700"
                                : s.rate >= 50
                                  ? "text-amber-700"
                                  : "text-rose-700",
                          )}
                        >
                          {s.total === 0 ? "–" : `${s.rate}%`}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                          {s.lastAbsence
                            ? format(parseISO(s.lastAbsence), "d.M.yyyy", {
                                locale: de,
                              })
                            : "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Letzte 8 Stunden
        </h2>
        {lastEight.length === 0 ? (
          <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
            Noch keine erfassten Stunden.
          </p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium">
                        Spieler
                      </th>
                      {lastEight.map((s) => (
                        <th
                          key={s.id}
                          className="px-2 py-2 text-center font-medium"
                        >
                          {format(parseISO(s.session_date), "d.M.", {
                            locale: de,
                          })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p) => (
                      <tr key={p.id} className="border-b last:border-b-0">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2">
                          <span className="inline-flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clay-soft text-[11px] font-semibold">
                              {initials(p)}
                            </span>
                            <span className="text-sm">
                              {formatPlayerName(p)}
                            </span>
                          </span>
                        </td>
                        {lastEight.map((s) => {
                          const status = byPlayer[p.id]?.[s.id];
                          return (
                            <td
                              key={s.id}
                              className="px-2 py-2 text-center text-sm font-semibold"
                            >
                              <CellGlyph status={status} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Entwicklung
        </h2>
        {players.length === 0 ? (
          <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
            Noch keine Spieler.
          </p>
        ) : (
          <ul className="space-y-3">
            {players.map((p) => {
              const recent = (notesByPlayer[p.id] ?? []).slice(0, 5);
              return (
                <li key={p.id}>
                  <Card>
                    <CardContent className="space-y-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/players/${p.id}`}
                          className="text-sm font-semibold hover:underline"
                        >
                          {formatPlayerName(p)}
                        </Link>
                        <span className="text-[11px] text-muted-foreground">
                          {recent.length === 0
                            ? "keine Notizen"
                            : `${recent.length} ${
                                recent.length === 1 ? "Notiz" : "Notizen"
                              }`}
                        </span>
                      </div>
                      {recent.length === 0 ? null : (
                        <ul className="space-y-1.5">
                          {recent.map((n) => (
                            <li
                              key={n.id}
                              className="rounded-md border bg-muted/20 p-2 text-xs"
                            >
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-medium uppercase tracking-wider text-[10px] text-muted-foreground">
                                  {NOTE_LABEL[n.category]}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {format(
                                    parseISO(n.note_date ?? n.created_at),
                                    "d.M.yyyy",
                                    { locale: de },
                                  )}
                                </span>
                              </div>
                              <p className="mt-1 whitespace-pre-wrap leading-snug">
                                {n.content}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function CellGlyph({ status }: { status: AttendanceStatus | undefined }) {
  if (status === "present")
    return <span className="text-emerald-600">✓</span>;
  if (status === "excused") return <span className="text-amber-600">E</span>;
  if (status === "absent") return <span className="text-rose-600">✗</span>;
  return <span className="text-muted-foreground/50">–</span>;
}
