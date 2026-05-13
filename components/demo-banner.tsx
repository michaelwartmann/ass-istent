import { GraduationCap, LogOut, Play } from "lucide-react";
import {
  enterDemoModeAction,
  exitDemoModeAction,
} from "@/lib/actions";
import {
  getViewAsCoachId,
  requireCoachId,
} from "@/lib/currentCoach";
import { getSupabaseServer } from "@/lib/supabase/server";

// Sticky strip rendered just below the SiteHeader on every (app) page.
// Two visual states:
//   - active   → amber, "Demo-Modus: {name}s Setup · Zurück"
//   - inactive → muted, "Demo: {name}s Setup ansehen · Anschauen"
// Hidden entirely if the viewer has no other demo coaches available
// (e.g. the demo source viewing themselves, or no demos flagged yet).
export async function DemoBanner() {
  const ownId = await requireCoachId();
  const viewAs = await getViewAsCoachId();
  const supabase = await getSupabaseServer();

  if (viewAs) {
    const { data } = await supabase
      .from("coaches")
      .select("name")
      .eq("id", viewAs)
      .maybeSingle();
    const name = data?.name ?? "Demo";
    return (
      <div className="sticky top-[var(--site-header-height,3rem)] z-20 border-y border-amber-300 bg-amber-100 text-amber-950">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span className="truncate">
              <span className="font-semibold uppercase tracking-wider">
                Demo-Modus
              </span>
              <span className="ml-1.5">· {name}s Setup (nur lesen)</span>
            </span>
          </div>
          <form action={exitDemoModeAction}>
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-400 bg-white/60 px-2 py-1 text-[11px] font-medium text-amber-950 transition active:scale-[0.97] hover:bg-white"
            >
              <LogOut className="h-3 w-3" />
              Zurück
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Inactive state: only render if there's at least one OTHER coach flagged
  // as a demo source. The demo source themselves sees no strip.
  const { data: demoCoaches } = await supabase
    .from("coaches")
    .select("id, name")
    .eq("is_demo", true)
    .neq("id", ownId)
    .order("name")
    .limit(1);
  const first = demoCoaches?.[0];
  if (!first) return null;

  return (
    <div className="sticky top-[var(--site-header-height,3rem)] z-20 border-y border-border/70 bg-muted/40 text-muted-foreground">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <GraduationCap className="h-4 w-4 shrink-0" />
          <span className="truncate">
            <span className="font-semibold uppercase tracking-wider">
              Demo
            </span>
            <span className="ml-1.5">· {first.name}s Setup anschauen</span>
          </span>
        </div>
        <form action={enterDemoModeAction.bind(null, { targetCoachId: first.id })}>
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-foreground transition active:scale-[0.97] hover:bg-accent"
          >
            <Play className="h-3 w-3" />
            Anschauen
          </button>
        </form>
      </div>
    </div>
  );
}
