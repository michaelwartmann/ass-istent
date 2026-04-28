import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCoachId } from "@/lib/currentCoach";
import { GroupForm } from "../group-form";

export const dynamic = "force-dynamic";

export default async function NewGroupPage() {
  await requireCoachId();
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Wochenplan
        </Link>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Neue Gruppe
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Anlegen</h1>
      </div>
      <GroupForm mode={{ kind: "create" }} />
    </div>
  );
}
