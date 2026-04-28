import Link from "next/link";
import { Suspense } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
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
            🎾 Passwort vergessen
          </h1>
          <p
            className="text-sm mt-3 leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            Gib deinen Trainer-Namen ein. Der Admin bekommt die Anfrage und
            setzt das Passwort zurück.
          </p>
        </div>

        <Suspense fallback={null}>
          <ForgotPasswordForm />
        </Suspense>

        <p className="text-center text-sm">
          <Link
            href="/login"
            className="underline"
            style={{ color: "var(--muted-foreground)" }}
          >
            Zurück zum Login
          </Link>
        </p>
      </div>
    </div>
  );
}
