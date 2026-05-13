import Link from "next/link";
import { ChevronRight, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseServer } from "@/lib/supabase/server";
import { currentReadCoachId } from "@/lib/currentCoach";
import { currentWeekMonday, isoDate } from "@/lib/format";
import {
  LEHRPLAN,
  NIVEAU_ORDER,
  type Niveau,
} from "@/lib/lehrplan";
import type { Group } from "@/lib/types";

export const dynamic = "force-dynamic";

type GroupSlim = Pick<Group, "id" | "name" | "location" | "niveau">;

async function loadGroupsByNiveau(
  coachId: string,
): Promise<Record<Niveau, GroupSlim[]>> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("groups")
    .select("id, name, location, niveau")
    .eq("coach_id", coachId)
    .not("niveau", "is", null)
    .order("name");

  const groups: Record<Niveau, GroupSlim[]> = {
    n1: [],
    n2: [],
    n3: [],
    vhs: [],
  };
  for (const g of (data ?? []) as GroupSlim[]) {
    if (g.niveau && g.niveau in groups) groups[g.niveau].push(g);
  }
  return groups;
}

export default async function LehrplanLandingPage() {
  const coachId = await currentReadCoachId();
  const byNiveau = await loadGroupsByNiveau(coachId);
  const weekIso = isoDate(currentWeekMonday());

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Lehrplan
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sommer 2026
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          29. April – 15. Juli 2026 · KW18–KW29
        </p>
      </div>

      <div className="space-y-3">
        {NIVEAU_ORDER.map((id) => {
          const n = LEHRPLAN[id];
          const groups = byNiveau[id];
          return (
            <Card key={id} className="overflow-hidden">
              <CardContent className="space-y-3 p-4">
                <Link
                  href={`/lehrplan/${id}`}
                  className="-m-1 flex items-start gap-2 rounded-md p-1 transition hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {n.ageRange ?? "Erwachsene · Mannschaft"}
                    </p>
                    <h2 className="truncate text-lg font-semibold leading-tight">
                      {n.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {n.focusLine}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>

                <div className="border-t pt-3">
                  <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Gruppen · {groups.length}
                  </p>
                  {groups.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Keine Gruppen zugeordnet.
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
                            <span className="truncate">{g.name}</span>
                            <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {g.location}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
