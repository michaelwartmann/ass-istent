import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import { Card, CardContent } from "@/components/ui/card";
import { PlayerNotes } from "@/components/player-notes";
import { PlayerGoals } from "@/components/player-goals";
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

  const [{ data: notes }, { data: gp }] = await Promise.all([
    supabase
      .from("player_notes")
      .select("*")
      .eq("player_id", id)
      .order("note_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("group_players")
      .select("group_id, group:groups!inner(id,name,coach_id)")
      .eq("player_id", id),
  ]);

  type GpJoin = {
    group_id: string;
    group:
      | { id: string; name: string; coach_id: string }
      | { id: string; name: string; coach_id: string }[]
      | null;
  };
  const groups: Pick<Group, "id" | "name">[] = [];
  for (const row of (gp ?? []) as GpJoin[]) {
    const g = Array.isArray(row.group) ? row.group[0] : row.group;
    if (g && g.coach_id === coachId) {
      groups.push({ id: g.id, name: g.name });
    }
  }

  return {
    player: player as Player,
    notes: (notes ?? []) as PlayerNote[],
    groups,
  };
}

export default async function PlayerDetailPage(
  props: PageProps<"/players/[id]">,
) {
  const coachId = await requireCoachId();
  const { id } = await props.params;
  const data = await load(id, coachId);
  if (!data) notFound();

  const { player, notes, groups } = data;
  const name = formatPlayerName(player);
  const handLabel =
    player.dominant_hand === "left"
      ? "Linkshand"
      : player.dominant_hand === "right"
        ? "Rechtshand"
        : null;
  const backhandLabel =
    player.backhand === "einhaendig"
      ? "Einhändige Rückhand"
      : player.backhand === "beidhaendig"
        ? "Beidhändige Rückhand"
        : null;

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
        <div className="mt-2 flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-clay-soft text-base font-semibold">
            {initials(player)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight leading-tight">
                {name}
              </h1>
              <Link
                href={`/players/${player.id}/edit`}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
                Bearbeiten
              </Link>
            </div>
            <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {player.year_of_birth ? (
                <span>Jg. {player.year_of_birth}</span>
              ) : null}
              {handLabel ? <span>{handLabel}</span> : null}
              {backhandLabel ? <span>{backhandLabel}</span> : null}
              {player.level ? <span>Niveau: {player.level}</span> : null}
              {groups.map((g) => (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="text-[var(--clay)] hover:underline"
                >
                  {g.name}
                </Link>
              ))}
            </p>
            {player.parent_contact ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Eltern: {player.parent_contact}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {player.description ? (
        <Card>
          <CardContent className="p-3 text-sm whitespace-pre-wrap">
            {player.description}
          </CardContent>
        </Card>
      ) : null}

      <PlayerGoals player={player} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Kommentare
        </h2>
        <PlayerNotes playerId={player.id} notes={notes} />
      </section>
    </div>
  );
}
