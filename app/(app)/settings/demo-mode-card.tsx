"use client";

import { useTransition } from "react";
import { ChevronRight, GraduationCap, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  enterDemoModeAction,
  exitDemoModeAction,
} from "@/lib/actions";

type DemoCoach = {
  id: string;
  name: string;
};

export function DemoModeCard({
  coaches,
  activeId,
}: {
  coaches: DemoCoach[];
  activeId: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function enter(coach: DemoCoach) {
    startTransition(async () => {
      try {
        await enterDemoModeAction({ targetCoachId: coach.id });
        toast.success(`Demo: ${coach.name}s Setup`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function exit() {
    startTransition(async () => {
      try {
        await exitDemoModeAction();
        toast.success("Zurück zu deinen Daten");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4 text-sm">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-[var(--clay)]" />
          <p className="font-medium">Demo-Modus</p>
        </div>
        <p className="text-muted-foreground">
          Schaue dir die Einrichtung eines anderen Trainers an. In diesem
          Modus ist Schreibzugriff deaktiviert — Spielerdaten bleiben
          unverändert.
        </p>
        <p className="text-[11px] text-muted-foreground">
          Demo-Modus zeigt echte Spielerdaten — nur an befugte Trainer
          weitergeben.
        </p>

        {coaches.length === 0 ? (
          <p className="rounded-md border border-dashed bg-muted/30 px-3 py-3 text-center text-xs text-muted-foreground">
            Keine Demo-Coaches verfügbar.
          </p>
        ) : (
          <ul className="space-y-2">
            {coaches.map((c) => {
              const active = c.id === activeId;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => (active ? exit() : enter(c))}
                    disabled={pending}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md border p-3 text-left transition active:scale-[0.98] disabled:opacity-60",
                      active
                        ? "border-amber-300 bg-amber-50 text-amber-950"
                        : "bg-card hover:bg-accent",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {active
                          ? "Aktiv — tippen zum Beenden"
                          : "Beispiel-Setup"}
                      </p>
                    </div>
                    {active ? (
                      <LogOut className="h-4 w-4 shrink-0 text-amber-700" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
