"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type ConfirmState =
  | { ok: true; coachName: string }
  | { error: "invalid" | "expired" | "server" }
  | undefined;

export async function confirmPasswordReset(
  _prev: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return { error: "invalid" };

  try {
    const supabase = getSupabaseAdmin();
    const { data: coach } = await supabase
      .from("coaches")
      .select("id, name, reset_expires_at")
      .eq("reset_token", token)
      .maybeSingle();

    if (!coach) return { error: "invalid" };

    const expires = coach.reset_expires_at
      ? new Date(coach.reset_expires_at as string).getTime()
      : 0;
    if (!expires || expires < Date.now()) {
      return { error: "expired" };
    }

    const { error } = await supabase
      .from("coaches")
      .update({
        password_hash: null,
        reset_token: null,
        reset_expires_at: null,
      })
      .eq("id", coach.id);
    if (error) {
      console.error("confirmPasswordReset update failed:", error);
      return { error: "server" };
    }

    return { ok: true, coachName: coach.name as string };
  } catch (err) {
    console.error("confirmPasswordReset failed:", err);
    return { error: "server" };
  }
}
