import Link from "next/link";
import { notFound } from "next/navigation";
import { getISOWeek, parseISO } from "date-fns";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import {
  currentWeekMonday,
  formatDayShort,
  isoDate,
} from "@/lib/format";
import {
  LEHRPLAN,
  isNiveau,
  type LehrplanWeek,
  type Niveau,
} from "@/lib/lehrplan";
import type { Group } from "@/lib/types";

export const dynamic = "force-dynamic";

type GroupSlim = Pick<Group, "id" | "name" | "location">;

async function loadGroups(
  coachId: string,
  niveau: Niveau,
): Promise<GroupSlim[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("groups")
    .select("id, name, location")
    .eq("coach_id", coachId)
    .eq("niveau", niveau)
    .order("name");
  return (data ?? []) as GroupSlim[];
}

export default async function NiveauDetailPage(
  props: PageProps<"/lehrplan/[niveau]">,
) {
  const { niveau } = await props.params;
  if (!isNiveau(niveau)) notFound();

  const coachId = await requireCoachId();
  const groups = await loadGroups(coachId, niveau);
  const n = LEHRPLAN[niveau];
  const weekIso = isoDate(currentWeekMonday());
  const currentKw = getISOWeek(new Date());

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/lehrplan"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Lehrplan
        </Link>
        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {n.ageRange ?? "Erwachsene · Mannschaft"}
        </p>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight">
          {n.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {n.description}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Gruppen
        </h2>
        {groups.length === 0 ? (
          <p className="rounded-md border border-dashed bg-muted/30 px-3 py-3 text-center text-xs text-muted-foreground">
            Keine Gruppen für dieses Niveau zugeordnet.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/groups/${g.id}?week=${weekIso}`}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium transition active:scale-[0.97] hover:bg-accent"
                >
                  <Users className="h-3 w-3" />
                  <span>{g.name}</span>
                  <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {g.location}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Periodisierung
        </h2>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-sm leading-relaxed text-muted-foreground">
            {n.periodisierung}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Stundenstruktur · 60 min
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <LessonCell label="Warm-up" value={n.lessonStructure.warmup} />
          <LessonCell label="Technik" value={n.lessonStructure.technik} />
          <LessonCell
            label="Taktik"
            value={n.lessonStructure.taktik ?? "—"}
            muted={n.lessonStructure.taktik === null}
          />
          <LessonCell label="Spielform" value={n.lessonStructure.spielform} />
        </div>
        {n.lessonStructure.taktik === null ? (
          <p className="text-[11px] text-muted-foreground">
            Taktik wird im Spielblock integriert (kein eigener Block).
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Wochen · {n.weeks.length}
        </h2>
        <ul className="space-y-2">
          {n.weeks.map((w) => (
            <WeekCard key={w.week} week={w} currentKw={currentKw} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function LessonCell({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border bg-card px-3 py-2",
        muted && "bg-muted/30 text-muted-foreground",
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function WeekCard({
  week,
  currentKw,
}: {
  week: LehrplanWeek;
  currentKw: number;
}) {
  const date = parseISO(week.date);
  const kw = getISOWeek(date);
  const isCurrent = kw === currentKw;
  return (
    <li>
      <Card
        className={cn(
          "overflow-hidden",
          isCurrent && "border-[var(--clay)] bg-clay-soft/40",
        )}
      >
        <CardContent className="space-y-2 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">
              KW{kw} · {formatDayShort(date)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Woche {week.week}
              {isCurrent ? " · Diese Woche" : ""}
            </p>
          </div>
          <p className="text-base font-medium leading-snug">
            {week.spielsituation}
          </p>
          <dl className="grid gap-1.5 text-sm">
            <Field label="Schlag / Ziel" value={week.schlagZiel} />
            <Field label="NBF" value={week.nbf} />
            <Field label="Akzent" value={week.akzent} />
            <Field label="Methodik" value={week.methodik} />
            <Field label="Bemerkung" value={week.bemerkung} muted />
          </dl>
        </CardContent>
      </Card>
    </li>
  );
}

function Field({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-2">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "leading-snug",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
