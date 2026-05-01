import Link from "next/link";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getISOWeek,
  startOfMonth,
} from "date-fns";
import { de } from "date-fns/locale";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import { isoDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarDay, Group } from "@/lib/types";

export const dynamic = "force-dynamic";

const MONTHS = [
  new Date(2026, 3, 1), // April
  new Date(2026, 4, 1), // Mai
  new Date(2026, 5, 1), // Juni
  new Date(2026, 6, 1), // Juli
  new Date(2026, 7, 1), // August
  new Date(2026, 8, 1), // September
];
const SEASON_START = "2026-04-01";
const SEASON_END = "2026-09-30";
const WEEKDAYS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function classForType(t: CalendarDay["type"]): string {
  switch (t) {
    case "feiertag":
      return "bg-rose-200 text-rose-950";
    case "schulferien":
      return "bg-amber-100 text-amber-900";
    case "sondertermin":
      return "bg-violet-200 text-violet-950";
    case "kein_unterricht":
      return "bg-slate-200 text-slate-700";
  }
}

export default async function CalendarPage() {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  const [{ data: cal }, { data: groups }] = await Promise.all([
    supabase
      .from("calendar_days")
      .select("*")
      .eq("coach_id", coachId)
      .gte("date", SEASON_START)
      .lte("date", SEASON_END),
    supabase
      .from("groups")
      .select("day_of_week")
      .eq("coach_id", coachId),
  ]);

  const calByDate = new Map<string, CalendarDay>();
  for (const c of (cal ?? []) as CalendarDay[]) calByDate.set(c.date, c);

  const trainingDays = new Set<number>(
    ((groups ?? []) as Pick<Group, "day_of_week">[]).map((g) => g.day_of_week),
  );

  const today = isoDate(new Date());

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Sommer 2026
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Kalender</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Tippe einen Trainingstag, um die Tagesübersicht zu öffnen.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <Legend cls="bg-rose-200 text-rose-950" label="Feiertag" />
        <Legend cls="bg-amber-100 text-amber-900" label="Schulferien" />
        <Legend cls="bg-violet-200 text-violet-950" label="Sondertermin" />
        <Legend cls="bg-emerald-100 text-emerald-900" label="Trainingstag" />
      </div>

      <div className="space-y-6">
        {MONTHS.map((m) => (
          <Month
            key={m.toISOString()}
            month={m}
            calByDate={calByDate}
            trainingDays={trainingDays}
            today={today}
          />
        ))}
      </div>
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${cls}`} aria-hidden />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function Month({
  month,
  calByDate,
  trainingDays,
  today,
}: {
  month: Date;
  calByDate: Map<string, CalendarDay>;
  trainingDays: Set<number>;
  today: string;
}) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  // Pad start so Mo = column 1
  const firstDow = ((start.getDay() + 6) % 7) + 1; // 1..7 Mo..So
  const leading = firstDow - 1;

  // Build rows of 7 cells (each row = 1 ISO week)
  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <section className="rounded-md border bg-card">
      <header className="flex items-baseline justify-between border-b px-3 py-2">
        <h2 className="text-base font-semibold tracking-tight">
          {format(month, "MMMM yyyy", { locale: de })}
        </h2>
      </header>
      <div className="grid grid-cols-[2.25rem_repeat(7,1fr)] text-[11px]">
        <div className="px-1.5 py-1.5 text-right text-muted-foreground">
          KW
        </div>
        {WEEKDAYS_DE.map((d) => (
          <div
            key={d}
            className="border-l px-1.5 py-1.5 text-center font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {weeks.map((row, ri) => {
          const firstReal = row.find((d): d is Date => d != null);
          const kw = firstReal ? getISOWeek(firstReal) : null;
          return (
            <div key={ri} className="contents">
              <div className="border-t px-1.5 py-1.5 text-right text-muted-foreground">
                {kw ?? ""}
              </div>
              {row.map((d, ci) => (
                <DayCell
                  key={ci}
                  date={d}
                  calByDate={calByDate}
                  trainingDays={trainingDays}
                  today={today}
                />
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DayCell({
  date,
  calByDate,
  trainingDays,
  today,
}: {
  date: Date | null;
  calByDate: Map<string, CalendarDay>;
  trainingDays: Set<number>;
  today: string;
}) {
  if (!date) {
    return <div className="border-t border-l bg-muted/20" />;
  }
  const iso = isoDate(date);
  const cal = calByDate.get(iso);
  const dow = ((date.getDay() + 6) % 7) + 1;
  const isTrainingDow = trainingDays.has(dow);
  const isOff = cal && (cal.type === "feiertag" || cal.type === "schulferien");
  const isToday = iso === today;
  const isTrainingDay = isTrainingDow && !isOff;

  const cellBase =
    "relative border-t border-l flex h-12 items-start justify-end p-1 text-xs";
  const colorCls = cal
    ? classForType(cal.type)
    : isTrainingDay
      ? "bg-emerald-100 text-emerald-900"
      : "";

  const inner = (
    <span
      className={cn(
        cellBase,
        colorCls,
        isToday && "ring-2 ring-[var(--clay)] ring-inset",
      )}
      title={cal?.label ?? undefined}
    >
      <span className="font-medium">{format(date, "d")}</span>
    </span>
  );

  if (isTrainingDay) {
    return (
      <Link href={`/day/${iso}`} className="hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return inner;
}
