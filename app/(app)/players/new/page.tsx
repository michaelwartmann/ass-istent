import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import { NewPlayerForm } from "./new-player-form";
import type { Group } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewPlayerPage(props: PageProps<"/players/new">) {
  const coachId = await requireCoachId();
  const supabase = await getSupabaseServer();
  const { data: groups } = await supabase
    .from("groups")
    .select("id,name,day_of_week,start_time")
    .eq("coach_id", coachId)
    .order("day_of_week")
    .order("start_time");

  const sp = await props.searchParams;
  const groupParam = sp.group;
  const initialGroupId = Array.isArray(groupParam) ? groupParam[0] : groupParam;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Neuer Spieler
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Anlegen</h1>
      </div>
      <NewPlayerForm
        groups={(groups ?? []) as Pick<Group, "id" | "name">[]}
        initialGroupId={initialGroupId}
      />
    </div>
  );
}
