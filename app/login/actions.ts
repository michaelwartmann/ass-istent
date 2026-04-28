"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export type LoginState =
  | { error?: "invalid" | "wrong-password" | "already-set" | "server" }
  | undefined;

type Coach = {
  id: string;
  name: string;
  password_hash: string | null;
};

async function loadCoach(name: string): Promise<Coach | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("coaches")
    .select("id, name, password_hash")
    .eq("name", name)
    .maybeSingle();
  return (data as Coach | null) ?? null;
}

async function issueSession(coach: Coach): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("coach_auth", "true", {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  cookieStore.set("coach_name", coach.name, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
  cookieStore.set("coach_id", coach.id, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
}

export type CheckResult =
  | { found: true; needsSetup: boolean }
  | { found: false };

// Name lookup: tells the form whether to show login, first-time-setup,
// or self-signup. ass-istent allows self-signup (gartenapp does not).
export async function checkCoachName(name: string): Promise<CheckResult> {
  const trimmed = name.trim();
  if (!trimmed) return { found: false };
  const coach = await loadCoach(trimmed);
  if (!coach) return { found: false };
  return { found: true, needsSetup: !coach.password_hash };
}

export async function setupPassword(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const coachName = String(formData.get("coachName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!coachName || password.length < 6 || password !== confirm) {
    return { error: "invalid" };
  }

  const coach = await loadCoach(coachName);
  if (!coach) return { error: "invalid" };
  if (coach.password_hash) return { error: "already-set" };

  const supabase = getSupabaseAdmin();
  const hash = await hashPassword(password);
  const { error } = await supabase
    .from("coaches")
    .update({
      password_hash: hash,
      reset_token: null,
      reset_expires_at: null,
    })
    .eq("id", coach.id);
  if (error) {
    console.error("setupPassword update failed:", error);
    return { error: "server" };
  }

  await issueSession(coach);
  redirect("/");
}

// Self-signup: create a brand-new coach with the given name + password.
export async function createCoachAccount(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const coachName = String(formData.get("coachName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!coachName || password.length < 6 || password !== confirm) {
    return { error: "invalid" };
  }

  const supabase = getSupabaseAdmin();

  const existing = await loadCoach(coachName);
  if (existing) return { error: "already-set" };

  const hash = await hashPassword(password);
  const { data, error } = await supabase
    .from("coaches")
    .insert({ name: coachName, password_hash: hash })
    .select("id, name, password_hash")
    .single();
  if (error || !data) {
    console.error("createCoachAccount insert failed:", error);
    return { error: "server" };
  }

  await issueSession(data as Coach);
  redirect("/");
}

export async function loginWithPassword(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const coachName = String(formData.get("coachName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!coachName || !password) return { error: "invalid" };

  const coach = await loadCoach(coachName);
  if (!coach || !coach.password_hash) return { error: "wrong-password" };

  const ok = await verifyPassword(password, coach.password_hash);
  if (!ok) return { error: "wrong-password" };

  await issueSession(coach);
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("coach_auth");
  cookieStore.delete("coach_name");
  cookieStore.delete("coach_id");
  redirect("/login");
}
