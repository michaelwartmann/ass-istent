import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import { PlayerForm } from "../../player-form";
import type { Group, Player } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditPlayerPage(
  props: PageProps<"/players/[id]/edit">,
) {
  const coachId = await requireCoachId();
  const { id } = await props.params;

  const supabase = await getSupabaseServer();
  const [{ data: player }, { data: groups }] = await Promise.all([
    supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .eq("coach_id", coachId)
      .maybeSingle(),
    supabase
      .from("groups")
      .select("id,name,day_of_week,start_time")
      .eq("coach_id", coachId)
      .order("day_of_week")
      .order("start_time"),
  ]);

  if (!player) notFound();

  return (
    <div className="space-y-4">
      <Link
        href={`/players/${id}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Zurück zum Profil
      </Link>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {(player as Player).first_name}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Bearbeiten</h1>
      </div>
      <PlayerForm
        mode={{ kind: "edit", player: player as Player }}
        groups={(groups ?? []) as Pick<Group, "id" | "name">[]}
      />
    </div>
  );
}
