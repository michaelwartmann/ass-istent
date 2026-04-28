import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import { Card, CardContent } from "@/components/ui/card";
import { PlayerNotes } from "@/components/player-notes";
import { formatPlayerName, initials } from "@/lib/format";
import type { Group, Player, PlayerNote } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load(id: string, coachId: string) {
  const supabase = await getSupabaseServer();
  const { data: player, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .eq("coach_id", coachId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!player) return null;

  const [{ data: notes }, { data: group }] = await Promise.all([
    supabase
      .from("player_notes")
      .select("*")
      .eq("player_id", id)
      .order("created_at", { ascending: false }),
    player.primary_group_id
      ? supabase
          .from("groups")
          .select("id,name")
          .eq("id", player.primary_group_id)
          .eq("coach_id", coachId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    player: player as Player,
    notes: (notes ?? []) as PlayerNote[],
    group: (group ?? null) as Pick<Group, "id" | "name"> | null,
  };
}

export default async function PlayerDetailPage(
  props: PageProps<"/players/[id]">,
) {
  const coachId = await requireCoachId();
  const { id } = await props.params;
  const data = await load(id, coachId);
  if (!data) notFound();

  const { player, notes, group } = data;
  const name = formatPlayerName(player);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/players"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Spielerliste
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-clay-soft text-base font-semibold">
            {initials(player)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight leading-tight">
              {name}
            </h1>
            <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {player.year_of_birth ? (
                <span>Jg. {player.year_of_birth}</span>
              ) : null}
              {player.dominant_hand ? (
                <span>
                  {player.dominant_hand === "left" ? "Linkshand" : "Rechtshand"}
                </span>
              ) : null}
              {player.level ? <span>Level: {player.level}</span> : null}
              {group ? (
                <Link
                  href={`/groups/${group.id}`}
                  className="text-[var(--clay)] hover:underline"
                >
                  {group.name}
                </Link>
              ) : null}
            </p>
            {player.parent_contact ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Eltern: {player.parent_contact}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {player.notes ? (
        <Card>
          <CardContent className="p-3 text-sm whitespace-pre-wrap">
            {player.notes}
          </CardContent>
        </Card>
      ) : null}

      <PlayerNotes playerId={player.id} notes={notes} />
    </div>
  );
}
