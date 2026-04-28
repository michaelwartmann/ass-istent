"use client";

import { useActionState } from "react";
import { confirmPasswordReset, type ConfirmState } from "./actions";

export default function ConfirmResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ConfirmState, FormData>(
    confirmPasswordReset,
    undefined,
  );

  if (state && "ok" in state && state.ok) {
    return (
      <div
        className="rounded-xl p-5 text-sm leading-relaxed text-center"
        style={{
          backgroundColor: "var(--clay-soft)",
          color: "var(--foreground)",
        }}
      >
        ✓ Passwort für <strong>{state.coachName}</strong> zurückgesetzt. Die
        Person kann sich jetzt mit einem neuen Passwort einloggen.
      </div>
    );
  }

  const errorText =
    state && "error" in state
      ? state.error === "expired"
        ? "Link ist abgelaufen."
        : state.error === "invalid"
          ? "Link ist ungültig."
          : "Etwas ist schiefgelaufen."
      : null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {errorText && (
        <p
          className="text-sm text-center"
          style={{ color: "var(--destructive)" }}
        >
          {errorText}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-4 rounded-xl text-white font-medium text-lg min-h-[56px] touch-none disabled:opacity-60 active:scale-[0.98] transition-transform"
        style={{ backgroundColor: "var(--clay)" }}
      >
        {pending ? "…" : "Ja, zurücksetzen"}
      </button>
    </form>
  );
}
