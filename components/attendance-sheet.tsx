"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { ClipboardCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  clearAttendanceAction,
  getAttendanceForDateAction,
  setAttendanceAction,
  setSessionCancelledAction,
} from "@/lib/actions";
import { formatPlayerName, initials } from "@/lib/format";
import type { AttendanceStatus, Player } from "@/lib/types";

type StatusOption = {
  value: AttendanceStatus;
  label: string;
  short: string;
  active: string;
};

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "present",
    label: "Anwesend",
    short: "✓",
    active: "bg-emerald-500 text-white border-emerald-500",
  },
  {
    value: "excused",
    label: "Entschuldigt",
    short: "E",
    active: "bg-amber-400 text-amber-950 border-amber-400",
  },
  {
    value: "absent",
    label: "Fehlt",
    short: "✗",
    active: "bg-rose-500 text-white border-rose-500",
  },
];

type SlimPlayer = Pick<
  Player,
  "id" | "first_name" | "last_name" | "year_of_birth"
>;

export function AttendanceSheet({
  groupId,
  players,
  initialSessionDate,
  initialAttendance,
  initialCancelled,
  todayIso,
}: {
  groupId: string;
  players: SlimPlayer[];
  initialSessionDate: string;
  initialAttendance: Record<string, AttendanceStatus>;
  initialCancelled: boolean;
  todayIso: string;
}) {
  const [open, setOpen] = useState(false);
  const safeInitialDate =
    initialSessionDate > todayIso ? todayIso : initialSessionDate;
  const [sessionDate, setSessionDate] = useState(safeInitialDate);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(
    initialAttendance,
  );
  const [cancelled, setCancelled] = useState(initialCancelled);
  const [pending, startTransition] = useTransition();

  // Refetch when the coach changes the date — past lessons may already
  // have records that aren't part of the page's initial payload.
  useEffect(() => {
    if (!open) return;
    if (sessionDate === safeInitialDate) {
      setMarks(initialAttendance);
      setCancelled(initialCancelled);
      return;
    }
    let cancelledFlag = false;
    (async () => {
      try {
        const data = await getAttendanceForDateAction({
          groupId,
          sessionDate,
        });
        if (cancelledFlag) return;
        setMarks(data.attendance);
        setCancelled(data.cancelled);
      } catch (err) {
        if (cancelledFlag) return;
        toast.error(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelledFlag = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDate, open, groupId]);

  function setStatus(playerId: string, next: AttendanceStatus) {
    const prev = marks[playerId];
    if (prev === next) {
      setMarks((m) => {
        const { [playerId]: _, ...rest } = m;
        void _;
        return rest;
      });
      startTransition(async () => {
        try {
          await clearAttendanceAction({ groupId, sessionDate, playerId });
        } catch (err) {
          setMarks((m) => ({ ...m, [playerId]: prev }));
          toast.error(err instanceof Error ? err.message : String(err));
        }
      });
      return;
    }
    setMarks((m) => ({ ...m, [playerId]: next }));
    startTransition(async () => {
      try {
        await setAttendanceAction({
          groupId,
          sessionDate,
          playerId,
          status: next,
        });
      } catch (err) {
        setMarks((m) => {
          if (prev === undefined) {
            const { [playerId]: _, ...rest } = m;
            void _;
            return rest;
          }
          return { ...m, [playerId]: prev };
        });
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function toggleCancelled(value: boolean) {
    const prev = cancelled;
    setCancelled(value);
    startTransition(async () => {
      try {
        await setSessionCancelledAction({
          groupId,
          sessionDate,
          cancelled: value,
        });
      } catch (err) {
        setCancelled(prev);
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  const dateLabel = format(parseISO(sessionDate), "EEEE, d. MMMM yyyy", {
    locale: de,
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Anwesenheit"
        className={cn(
          buttonVariants({ size: "icon" }),
          "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-[var(--clay)] shadow-lg hover:bg-[var(--clay)]/90",
        )}
      >
        <ClipboardCheck className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="bottom" className="flex h-[85dvh] flex-col">
        <SheetHeader>
          <SheetTitle>Anwesenheit</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Stunde am
            </label>
            <input
              type="date"
              value={sessionDate}
              max={todayIso}
              onChange={(e) => setSessionDate(e.target.value)}
              className="block w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">{dateLabel}</p>
          </div>
          <label className="flex items-center justify-between rounded-md border bg-card p-3">
            <span className="text-sm">Stunde abgesagt</span>
            <input
              type="checkbox"
              checked={cancelled}
              onChange={(e) => toggleCancelled(e.target.checked)}
              className="h-5 w-5 accent-[var(--clay)]"
            />
          </label>
          {cancelled ? (
            <p className="rounded-md border border-dashed bg-muted/30 px-3 py-3 text-center text-xs text-muted-foreground">
              Diese Stunde gilt als abgesagt und wird im Bericht nicht
              gewertet.
            </p>
          ) : null}
          {players.length === 0 ? (
            <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
              Keine Spieler in dieser Gruppe.
            </p>
          ) : (
            <ul className="space-y-2">
              {players.map((p) => {
                const current = marks[p.id];
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 rounded-md border bg-card p-2"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-soft text-sm font-semibold">
                      {initials(p)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {formatPlayerName(p)}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      {STATUS_OPTIONS.map((opt) => {
                        const isActive = current === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            aria-pressed={isActive}
                            aria-label={opt.label}
                            disabled={cancelled || pending}
                            onClick={() => setStatus(p.id, opt.value)}
                            className={cn(
                              "inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition",
                              isActive
                                ? opt.active
                                : "border-border text-muted-foreground hover:bg-accent",
                              cancelled ? "opacity-40" : "",
                            )}
                          >
                            {opt.short}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <SheetFooter className="flex-row items-center justify-between gap-2 border-t pt-3">
          <Link
            href={`/groups/${groupId}/report`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Bericht ansehen
            <ExternalLink className="h-3 w-3" />
          </Link>
          <Button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-[var(--clay)] hover:bg-[var(--clay)]/90"
          >
            Fertig
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
