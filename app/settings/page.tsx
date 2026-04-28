import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Einstellungen
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>
      <Card>
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="font-medium">v1 — Single-Coach</p>
          <p className="text-muted-foreground">
            Kommt bald: zweiter Coach, Auth, Backup, Export.
          </p>
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
            Seed:{" "}
            <code className="rounded bg-muted px-1">npx tsx scripts/seed.ts</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
