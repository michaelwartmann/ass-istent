"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { setSessionCancelledAction } from "@/lib/actions";
import { PlayerAttendanceRow } from "@/components/player-attendance-row";
import type { AttendanceStatus, Player } from "@/lib/types";

type SlimPlayer = Pick<
  Player,
  "id" | "first_name" | "last_name" | "year_of_birth"
>;

export function GroupAttendanceList({
  groupId,
  players,
  sessionDate,
  initialAttendance,
  initialCancelled,
}: {
  groupId: string;
  players: SlimPlayer[];
  sessionDate: string;
  initialAttendance: Record<string, AttendanceStatus>;
  initialCancelled: boolean;
}) {
  const [cancelled, setCancelled] = useState(initialCancelled);
  const [, startTransition] = useTransition();

  function toggle() {
    const prev = cancelled;
    const next = !prev;
    setCancelled(next);
    startTransition(async () => {
      try {
        await setSessionCancelledAction({
          groupId,
          sessionDate,
          cancelled: next,
        });
      } catch (err) {
        setCancelled(prev);
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  if (players.length === 0) {
    return (
      <p className="rounded-md border border-dashed bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
        Noch keine Spieler in dieser Gruppe.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={cancelled}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition",
            cancelled
              ? "border-rose-300 bg-rose-100 text-rose-900"
              : "border-border text-muted-foreground hover:bg-accent",
          )}
        >
          <Ban className="h-3 w-3" />
          {cancelled ? "Stunde abgesagt" : "Stunde abgesagt?"}
        </button>
      </div>
      {cancelled ? (
        <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
          Diese Stunde gilt als abgesagt — keine Anwesenheit erfasst.
        </p>
      ) : null}
      <ul className="space-y-2">
        {players.map((p) => (
          <PlayerAttendanceRow
            key={p.id}
            player={p}
            groupId={groupId}
            sessionDate={sessionDate}
            initialStatus={initialAttendance[p.id]}
            disabled={cancelled}
          />
        ))}
      </ul>
    </div>
  );
}
