import Link from "next/link";
import { UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseServer } from "@/lib/supabase/server";
import { formatPlayerName, initials } from "@/lib/format";
import type { Group, Player } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load() {
  const supabase = await getSupabaseServer();
  const [{ data: players, error }, { data: groups }] = await Promise.all([
    supabase.from("players").select("*").order("first_name"),
    supabase.from("groups").select("id,name"),
  ]);
  const groupMap = new Map<string, Pick<Group, "id" | "name">>(
    ((groups ?? []) as Pick<Group, "id" | "name">[]).map((g) => [g.id, g]),
  );
  return {
    players: (players ?? []) as Player[],
    groupMap,
    error: error?.message ?? null,
  };
}

export default async function PlayersPage() {
  const { players, groupMap, error } = await load();
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Spieler
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {players.length} insgesamt
          </h1>
        </div>
        <Link
          href="/players/new"
          className={cn(
            buttonVariants({ size: "sm" }),
            "bg-[var(--clay)] hover:bg-[var(--clay)]/90",
          )}
        >
          <UserPlus className="mr-1 h-4 w-4" />
          Neu
        </Link>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="font-semibold text-destructive">
              Konnte Spieler nicht laden
            </p>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-muted-foreground">
              Schema aus{" "}
              <code className="rounded bg-muted px-1">supabase/schema.sql</code>{" "}
              im SQL-Editor ausführen.
            </p>
          </CardContent>
        </Card>
      ) : players.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 p-6 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Noch keine Spieler.</p>
            <p>Über &quot;Neu&quot; den ersten Spieler anlegen.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {players.map((p) => {
            const group = p.primary_group_id
              ? groupMap.get(p.primary_group_id)
              : null;
            return (
              <li key={p.id}>
                <Link
                  href={`/players/${p.id}`}
                  className="flex items-center gap-3 rounded-md border bg-card p-3 transition hover:bg-accent"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay-soft text-sm font-semibold">
                    {initials(p)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {formatPlayerName(p)}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[group?.name, p.year_of_birth ? `Jg. ${p.year_of_birth}` : null]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
