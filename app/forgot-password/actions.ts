"use server";

import { randomBytes } from "crypto";
import { sendResetRequestEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type ForgotState = { ok: true } | { error: "server" } | undefined;

const RESET_DEDUP_WINDOW_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// Always returns generic "ok" so this endpoint doesn't leak which coach
// names exist. If the name isn't known, we just skip the write.
export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const coachName = String(formData.get("coachName") ?? "").trim();
  if (!coachName) return { ok: true };

  try {
    const supabase = getSupabaseAdmin();
    const { data: coach } = await supabase
      .from("coaches")
      .select("id, name, reset_token, reset_expires_at")
      .eq("name", coachName)
      .maybeSingle();

    if (coach) {
      const nowMs = Date.now();
      const expMs = coach.reset_expires_at
        ? new Date(coach.reset_expires_at as string).getTime()
        : 0;
      const issuedMs = expMs - RESET_TOKEN_TTL_MS;
      const recentlyIssued =
        !!coach.reset_token &&
        expMs > nowMs &&
        nowMs - issuedMs < RESET_DEDUP_WINDOW_MS;

      if (!recentlyIssued) {
        const token = randomBytes(32).toString("hex");
        const expires = new Date(nowMs + RESET_TOKEN_TTL_MS).toISOString();
        const { error } = await supabase
          .from("coaches")
          .update({ reset_token: token, reset_expires_at: expires })
          .eq("id", coach.id);
        if (error) {
          console.error("requestPasswordReset update failed:", error);
          return { error: "server" };
        }

        const appUrl = process.env.APP_URL || "http://localhost:3000";
        const confirmUrl = `${appUrl.replace(/\/$/, "")}/admin/reset/${token}`;
        await sendResetRequestEmail(coach.name as string, confirmUrl);
      }
    }
    return { ok: true };
  } catch (err) {
    console.error("requestPasswordReset failed:", err);
    return { error: "server" };
  }
}
