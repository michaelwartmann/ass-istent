import Link from "next/link";
import { Pencil } from "lucide-react";
import type { Player } from "@/lib/types";

type Dim = {
  key: keyof Pick<
    Player,
    "goal_technical" | "goal_tactical" | "goal_physical" | "goal_mental"
  >;
  label: string;
  badge: string;
};

const DIMS: Dim[] = [
  {
    key: "goal_technical",
    label: "Technik",
    badge: "bg-sky-100 text-sky-900 border-sky-200",
  },
  {
    key: "goal_tactical",
    label: "Taktik",
    badge: "bg-violet-100 text-violet-900 border-violet-200",
  },
  {
    key: "goal_physical",
    label: "Athletik",
    badge: "bg-rose-100 text-rose-900 border-rose-200",
  },
  {
    key: "goal_mental",
    label: "Mental",
    badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
];

export function PlayerGoals({ player }: { player: Player }) {
  const empty = DIMS.every((d) => !player[d.key]);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Aktuelle Lernziele
        </h2>
        <Link
          href={`/players/${player.id}/edit`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
          {empty ? "setzen" : "anpassen"}
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {DIMS.map((d) => (
          <div
            key={d.key}
            className="rounded-md border bg-card p-3"
          >
            <span
              className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${d.badge}`}
            >
              {d.label}
            </span>
            <p
              className={`mt-2 whitespace-pre-wrap text-sm leading-snug ${
                player[d.key] ? "" : "italic text-muted-foreground"
              }`}
            >
              {player[d.key] || "noch kein Ziel gesetzt"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
