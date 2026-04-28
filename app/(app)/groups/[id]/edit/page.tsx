import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCoachId } from "@/lib/currentCoach";
import type { Group } from "@/lib/types";
import { GroupForm } from "../../group-form";

export const dynamic = "force-dynamic";

export default async function EditGroupPage(
  props: PageProps<"/groups/[id]/edit">,
) {
  const coachId = await requireCoachId();
  const { id } = await props.params;
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .eq("coach_id", coachId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) notFound();

  const group = data as Group;

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/groups/${group.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          {group.name}
        </Link>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Gruppe bearbeiten
        </p>
        <h1 className="text-2xl font-semibold tracking-tight leading-tight">
          {group.name}
        </h1>
      </div>
      <GroupForm mode={{ kind: "edit", group }} />
    </div>
  );
}
