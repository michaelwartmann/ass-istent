import { LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getCurrentCoachName,
  requireCoachId,
} from "@/lib/currentCoach";
import { signOutAction } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireCoachId();
  const coachName = await getCurrentCoachName();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Einstellungen
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-clay-soft text-lg">
            🎾
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Eingeloggt als
            </p>
            <p className="truncate text-base font-semibold">
              {coachName ?? "Trainer"}
            </p>
          </div>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="gap-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              Abmelden
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="font-medium">Datenbank</p>
          <p className="text-muted-foreground">
            Schema:{" "}
            <code className="rounded bg-muted px-1">supabase/schema.sql</code>
          </p>
          <p className="text-muted-foreground">
            Migrationen:{" "}
            <code className="rounded bg-muted px-1">
              supabase/migrations/
            </code>{" "}
            (manuell im SQL-Editor anwenden)
          </p>
          <p className="text-muted-foreground">
            Seed:{" "}
            <code className="rounded bg-muted px-1">
              npx tsx scripts/seed.ts
            </code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="font-medium">Auth</p>
          <p className="text-muted-foreground">
            Mehrere Trainer können sich anlegen — je eigener Bestand,
            eigene Gruppen, eigene Spieler. Übungs-Katalog ist
            gemeinsam.
          </p>
          <p className="text-muted-foreground">
            Passwort vergessen? Reset-Anfragen landen im Server-Log
            (oder per E-Mail, wenn{" "}
            <code className="rounded bg-muted px-1">RESEND_API_KEY</code>{" "}
            gesetzt ist).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
