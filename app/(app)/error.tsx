"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const looksLikeMissingTable =
    /Could not find the table|relation .* does not exist|schema cache/i.test(
      error.message ?? "",
    );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Fehler
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Etwas ist schiefgelaufen
        </h1>
      </div>
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="font-medium text-destructive">{error.message}</p>
          {looksLikeMissingTable ? (
            <p className="text-muted-foreground">
              Die Datenbank ist noch nicht initialisiert. Inhalt von{" "}
              <code className="rounded bg-muted px-1">
                supabase/schema.sql
              </code>{" "}
              im Supabase SQL-Editor ausführen, dann{" "}
              <code className="rounded bg-muted px-1">
                npx tsx scripts/seed.ts
              </code>{" "}
              für Beispieldaten.
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Button onClick={reset} variant="outline">
        Nochmal versuchen
      </Button>
    </div>
  );
}
