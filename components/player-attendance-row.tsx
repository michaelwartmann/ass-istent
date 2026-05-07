"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  clearAttendanceAction,
  setAttendanceAction,
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

export function PlayerAttendanceRow({
  player,
  groupId,
  sessionDate,
  initialStatus,
  disabled,
}: {
  player: SlimPlayer;
  groupId: string;
  sessionDate: string;
  initialStatus: AttendanceStatus | undefined;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<AttendanceStatus | undefined>(
    initialStatus,
  );
  const [pending, startTransition] = useTransition();

  function pick(next: AttendanceStatus) {
    const prev = status;
    if (prev === next) {
      setStatus(undefined);
      startTransition(async () => {
        try {
          await clearAttendanceAction({
            groupId,
            sessionDate,
            playerId: player.id,
          });
        } catch (err) {
          setStatus(prev);
          toast.error(err instanceof Error ? err.message : String(err));
        }
      });
      return;
    }
    setStatus(next);
    startTransition(async () => {
      try {
        await setAttendanceAction({
          groupId,
          sessionDate,
          playerId: player.id,
          status: next,
        });
      } catch (err) {
        setStatus(prev);
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <li className="flex items-center gap-2 rounded-md border bg-card p-2">
      <Link
        href={`/players/${player.id}`}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md transition active:scale-[0.97] hover:bg-accent"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-soft text-sm font-semibold">
          {initials(player)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium leading-tight">
            {formatPlayerName(player)}
          </span>
          {player.year_of_birth ? (
            <span className="block text-[11px] text-muted-foreground">
              Jg. {player.year_of_birth}
            </span>
          ) : null}
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isActive}
              aria-label={opt.label}
              disabled={disabled || pending}
              onClick={() => pick(opt.value)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition",
                isActive
                  ? opt.active
                  : "border-border text-muted-foreground hover:bg-accent",
                disabled ? "pointer-events-none opacity-40" : "",
              )}
            >
              {opt.short}
            </button>
          );
        })}
      </div>
    </li>
  );
}
