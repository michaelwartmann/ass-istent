"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import {
  checkCoachName,
  createCoachAccount,
  loginWithPassword,
  setupPassword,
  type LoginState,
} from "./actions";

type Stage =
  | { kind: "name" }
  | {
      kind: "password";
      coachName: string;
      mode: "login" | "setup" | "signup";
    };

export default function LoginPage() {
  const [stage, setStage] = useState<Stage>({ kind: "name" });
  const [nameError, setNameError] = useState<string | null>(null);
  const [checking, startChecking] = useTransition();
  const [name, setName] = useState("");

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-8"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-medium"
            style={{ color: "var(--foreground)" }}
          >
            🎾 ass-istent
          </h1>
          <p
            className="text-sm mt-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            Coach-Notizbuch
          </p>
        </div>

        {stage.kind === "name" ? (
          <NameStage
            name={name}
            setName={setName}
            checking={checking}
            error={nameError}
            onSubmit={(value) => {
              setNameError(null);
              startChecking(async () => {
                const result = await checkCoachName(value);
                if (!result.found) {
                  setStage({
                    kind: "password",
                    coachName: value,
                    mode: "signup",
                  });
                  return;
                }
                setStage({
                  kind: "password",
                  coachName: value,
                  mode: result.needsSetup ? "setup" : "login",
                });
              });
            }}
          />
        ) : (
          <PasswordStage
            coachName={stage.coachName}
            mode={stage.mode}
            onBack={() => {
              setStage({ kind: "name" });
              setNameError(null);
            }}
          />
        )}
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-10px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(10px);
          }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}

function NameStage(props: {
  name: string;
  setName: (v: string) => void;
  checking: boolean;
  error: string | null;
  onSubmit: (value: string) => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const value = props.name.trim();
        if (!value) return;
        props.onSubmit(value);
      }}
      className={`space-y-5 ${props.error ? "animate-shake" : ""}`}
      key={props.error ?? ""}
    >
      <div className="space-y-2">
        <label
          htmlFor="coachName"
          className="block text-xs font-medium uppercase tracking-wide"
          style={{ color: "var(--muted-foreground)" }}
        >
          Trainer-Name
        </label>
        <input
          id="coachName"
          type="text"
          value={props.name}
          onChange={(e) => props.setName(e.target.value)}
          placeholder="Dein Name"
          className="w-full px-6 py-4 rounded-xl border-2 bg-card text-lg focus:outline-none min-h-[56px]"
          style={{
            borderColor: props.error
              ? "var(--destructive)"
              : "var(--border)",
            color: "var(--foreground)",
          }}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
        />
        {props.error && (
          <p
            className="text-sm pl-1"
            style={{ color: "var(--destructive)" }}
          >
            {props.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={props.checking}
        className="w-full py-4 rounded-xl text-white font-medium text-lg min-h-[56px] touch-none disabled:opacity-60 active:scale-[0.98] transition-transform"
        style={{ backgroundColor: "var(--clay)" }}
      >
        {props.checking ? "…" : "Weiter"}
      </button>
    </form>
  );
}

function PasswordStage(props: {
  coachName: string;
  mode: "login" | "setup" | "signup";
  onBack: () => void;
}) {
  const action =
    props.mode === "login"
      ? loginWithPassword
      : props.mode === "setup"
        ? setupPassword
        : createCoachAccount;
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    action,
    undefined,
  );
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (state?.error) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(t);
    }
  }, [state]);

  const needsConfirm = props.mode !== "login";

  const errorText =
    state?.error === "wrong-password"
      ? "Falsches Passwort."
      : state?.error === "invalid"
        ? needsConfirm
          ? "Passwörter stimmen nicht überein (mindestens 6 Zeichen)."
          : "Bitte Passwort eingeben."
        : state?.error === "already-set"
          ? "Account existiert bereits — bitte einloggen."
          : state?.error === "server"
            ? "Etwas ist schiefgelaufen."
            : null;

  const helperText =
    props.mode === "setup" ? (
      <>
        Erstes Einloggen für <strong>{props.coachName}</strong> — wähle jetzt
        dein Passwort.
      </>
    ) : props.mode === "signup" ? (
      <>
        Neuen Account für <strong>{props.coachName}</strong> anlegen. Wähle
        ein Passwort.
      </>
    ) : null;

  const submitLabel =
    props.mode === "login"
      ? "Einloggen"
      : props.mode === "setup"
        ? "Passwort festlegen"
        : "Account anlegen";

  return (
    <form
      action={formAction}
      className={`space-y-5 ${shake ? "animate-shake" : ""}`}
    >
      <input type="hidden" name="coachName" value={props.coachName} />

      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--clay)", fontSize: "1.1rem" }}>
            {props.mode === "signup" ? "+" : "✓"}
          </span>
          <span style={{ color: "var(--foreground)" }}>
            {props.coachName}
          </span>
        </div>
        <button
          type="button"
          onClick={props.onBack}
          className="text-xs underline touch-none"
          style={{ color: "var(--muted-foreground)" }}
        >
          ändern
        </button>
      </div>

      {helperText && (
        <p
          className="text-sm leading-relaxed px-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          {helperText}
        </p>
      )}

      <div className="space-y-3">
        <input
          type="password"
          name="password"
          placeholder={
            needsConfirm ? "Neues Passwort (min. 6 Zeichen)" : "Passwort"
          }
          className="w-full px-6 py-4 rounded-xl border-2 bg-card text-lg focus:outline-none min-h-[56px]"
          style={{
            borderColor: state?.error
              ? "var(--destructive)"
              : "var(--border)",
            color: "var(--foreground)",
          }}
          autoFocus
          autoComplete={needsConfirm ? "new-password" : "current-password"}
          minLength={needsConfirm ? 6 : undefined}
          required
        />
        {needsConfirm && (
          <input
            type="password"
            name="confirmPassword"
            placeholder="Passwort bestätigen"
            className="w-full px-6 py-4 rounded-xl border-2 bg-card text-lg focus:outline-none min-h-[56px]"
            style={{
              borderColor: state?.error
                ? "var(--destructive)"
                : "var(--border)",
              color: "var(--foreground)",
            }}
            autoComplete="new-password"
            minLength={6}
            required
          />
        )}
      </div>

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
        {pending ? "…" : submitLabel}
      </button>

      {props.mode === "login" && (
        <p className="text-center text-sm">
          <Link
            href={`/forgot-password?name=${encodeURIComponent(props.coachName)}`}
            style={{ color: "var(--muted-foreground)" }}
            className="underline"
          >
            Passwort vergessen?
          </Link>
        </p>
      )}
    </form>
  );
}
