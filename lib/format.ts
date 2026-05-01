import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import type { BallType, BlockType, ExerciseCategory } from "./types";

export const DAYS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const DAYS_LONG_DE = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];

export function formatTime(time: string) {
  // "14:00:00" -> "14:00"
  return time.slice(0, 5);
}

export function formatTimeRange(start: string, end: string) {
  return `${formatTime(start)}–${formatTime(end)}`;
}

export function currentWeekMonday(now: Date = new Date()) {
  return startOfWeek(now, { weekStartsOn: 1 });
}

export function weekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function formatWeekRange(monday: Date) {
  const sun = addDays(monday, 6);
  return `${format(monday, "d. MMM", { locale: de })} – ${format(sun, "d. MMM yyyy", { locale: de })}`;
}

export function isoDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function parseDate(s: string) {
  return parseISO(s);
}

// "Mi 6.5." — used inline next to the long day name in the week view.
export function formatDayShort(d: Date) {
  return format(d, "EEEEEE d.M.", { locale: de });
}

// "Mittwoch, 6. Mai 2026" — page heading in day view.
export function formatDateLong(d: Date) {
  return format(d, "EEEE, d. MMMM yyyy", { locale: de });
}

// "Mi, 6.5.2026" — comment-list timestamp.
export function formatNoteDate(d: Date) {
  return format(d, "EEEEEE, d.M.yyyy", { locale: de });
}

export function shiftWeek(monday: Date, delta: number) {
  return addDays(monday, delta * 7);
}

export function ballBadgeClass(ball: BallType | null | undefined) {
  switch (ball) {
    case "green":
      return "bg-emerald-500 text-white";
    case "orange":
      return "bg-orange-500 text-white";
    case "red":
      return "bg-red-500 text-white";
    case "hard":
      return "bg-yellow-300 text-yellow-950";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function ballLabel(ball: BallType | null | undefined) {
  switch (ball) {
    case "green":
      return "Grün";
    case "orange":
      return "Orange";
    case "red":
      return "Rot";
    case "hard":
      return "Hart";
    default:
      return "–";
  }
}

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  warm_up: "Warm-up",
  technical: "Technik",
  tactical: "Taktik",
  physical: "Athletik",
  points: "Punktspiel",
  cool_down: "Cool-down",
};

export function categoryLabel(c: ExerciseCategory | BlockType) {
  return CATEGORY_LABELS[c as ExerciseCategory] ?? c;
}

export function blockBadgeClass(b: BlockType) {
  switch (b) {
    case "warm_up":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "technical":
      return "bg-sky-100 text-sky-900 border-sky-200";
    case "tactical":
      return "bg-violet-100 text-violet-900 border-violet-200";
    case "physical":
      return "bg-rose-100 text-rose-900 border-rose-200";
    case "points":
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    case "cool_down":
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function initials(player: { first_name: string; last_name: string | null }) {
  const first = player.first_name?.[0] ?? "";
  const last = player.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

export function formatPlayerName(p: { first_name: string; last_name: string | null }) {
  return p.last_name ? `${p.first_name} ${p.last_name}` : p.first_name;
}
