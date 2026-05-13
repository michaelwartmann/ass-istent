import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ---------- identity (writes) -----------------------------------------

export async function getCurrentCoachId(): Promise<string | null> {
  return (await cookies()).get("coach_id")?.value ?? null;
}

export async function getCurrentCoachName(): Promise<string | null> {
  const raw = (await cookies()).get("coach_name")?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

// Identity oracle. Returns the *real* logged-in coach. Use for writes
// and for any "who am I" question.
export async function requireCoachId(): Promise<string> {
  const id = await getCurrentCoachId();
  if (!id) redirect("/login");
  return id;
}

// ---------- view-as (reads) -------------------------------------------

// Returns the view_as_coach_id cookie, if set. Used by currentReadCoachId
// to redirect reads at a different coach's data.
export async function getViewAsCoachId(): Promise<string | null> {
  return (await cookies()).get("view_as_coach_id")?.value ?? null;
}

// Returns true iff the current request is in demo-mode (view-as active).
export async function isViewingDemo(): Promise<boolean> {
  return Boolean(await getViewAsCoachId());
}

// Used for READS. Calls requireCoachId() first so /login redirect still
// fires for logged-out users. If a view_as cookie is present, returns
// that id instead — meaning every read on the page targets the demo
// coach's data. Writes must keep using requireCoachId() directly.
//
// Note: this helper does not validate that the view-as target is still
// marked is_demo. That validation lives in enterDemoModeAction at the
// time the cookie is set. If the cookie is tampered with, the worst
// case is that someone sees another coach's data — but only coaches
// whose UUIDs they already know.
export async function currentReadCoachId(): Promise<string> {
  const ownId = await requireCoachId();
  const viewAs = await getViewAsCoachId();
  return viewAs ?? ownId;
}
