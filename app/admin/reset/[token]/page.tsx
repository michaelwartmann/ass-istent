import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import ConfirmResetForm from "./ConfirmResetForm";

export const dynamic = "force-dynamic";

export default async function AdminResetPage(
  props: PageProps<"/admin/reset/[token]">,
) {
  const { token } = await props.params;
  const supabase = getSupabaseAdmin();
  const { data: coach } = await supabase
    .from("coaches")
    .select("name, reset_expires_at")
    .eq("reset_token", token)
    .maybeSingle();

  const expires = coach?.reset_expires_at
    ? new Date(coach.reset_expires_at as string).getTime()
    : 0;
  const valid = !!coach && expires > Date.now();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-8"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1
            className="text-2xl font-medium"
            style={{ color: "var(--foreground)" }}
          >
            🔑 Passwort zurücksetzen
          </h1>
        </div>

        {valid ? (
          <>
            <p
              className="text-sm leading-relaxed text-center"
              style={{ color: "var(--muted-foreground)" }}
            >
              Passwort für Trainer{" "}
              <strong>{coach!.name as string}</strong> wirklich zurücksetzen?
              Die Person muss sich danach mit einem neuen Passwort einloggen.
            </p>
            <ConfirmResetForm token={token} />
          </>
        ) : (
          <div
            className="rounded-xl p-5 text-sm leading-relaxed text-center"
            style={{
              backgroundColor: "color-mix(in oklab, var(--destructive) 12%, transparent)",
              color: "var(--destructive)",
            }}
          >
            Dieser Link ist ungültig oder abgelaufen. Die anfragende Person
            muss eine neue Zurücksetzung anfragen.
          </div>
        )}

        <p className="text-center text-sm">
          <Link
            href="/login"
            className="underline"
            style={{ color: "var(--muted-foreground)" }}
          >
            Zum Login
          </Link>
        </p>
      </div>
    </div>
  );
}
