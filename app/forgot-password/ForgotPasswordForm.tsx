"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset, type ForgotState } from "./actions";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const prefilled = searchParams.get("name") ?? "";
  const [state, formAction, pending] = useActionState<ForgotState, FormData>(
    requestPasswordReset,
    undefined,
  );

  if (state && "ok" in state && state.ok) {
    return (
      <div
        className="rounded-xl p-5 text-sm leading-relaxed"
        style={{
          backgroundColor: "var(--clay-soft)",
          color: "var(--foreground)",
        }}
      >
        ✓ Falls dieser Trainer existiert, ist eine Reset-Anfrage raus. Der
        Admin (Michael) bestätigt sie und meldet sich bei dir.
      </div>
    );
  }

  const errorText =
    state && "error" in state
      ? "Etwas ist schiefgelaufen. Bitte nochmal."
      : null;

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="text"
        name="coachName"
        defaultValue={prefilled}
        placeholder="Dein Trainer-Name"
        required
        autoFocus
        autoComplete="off"
        autoCapitalize="words"
        className="w-full px-6 py-4 rounded-xl border-2 bg-card text-lg focus:outline-none min-h-[56px]"
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
      />

      {errorText && (
        <p className="text-sm pl-1" style={{ color: "var(--destructive)" }}>
          {errorText}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-4 rounded-xl text-white font-medium text-lg min-h-[56px] touch-none disabled:opacity-60 active:scale-[0.98] transition-transform"
        style={{ backgroundColor: "var(--clay)" }}
      >
        {pending ? "…" : "Zurücksetzung anfragen"}
      </button>
    </form>
  );
}
