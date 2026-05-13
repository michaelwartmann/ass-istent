import { GraduationCap, LogOut } from "lucide-react";
import { exitDemoModeAction } from "@/lib/actions";
import { getViewAsCoachId } from "@/lib/currentCoach";
import { getSupabaseServer } from "@/lib/supabase/server";

// Server component. When the viewer has a view_as_coach_id cookie set,
// renders a sticky banner with the demo coach's name and an exit form.
// Returns null otherwise — the banner disappears entirely in normal mode.
export async function DemoBanner() {
  const viewAs = await getViewAsCoachId();
  if (!viewAs) return null;

  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("coaches")
    .select("name, is_demo")
    .eq("id", viewAs)
    .maybeSingle();

  // If the cookie points at a coach that no longer exists or is no
  // longer flagged as demo, render a generic banner — the readPath
  // already falls back to own data so the page itself is safe.
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
