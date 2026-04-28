// Password-reset notification.
//
// In production you'd plug Resend in here (gartenapp does — see
// /home/mike_io/gartenapp/lib/email.ts). For ass-istent v1 we just log
// the reset link to stdout: the dev sees the URL in the terminal, clicks
// it, and resets the password manually. Add Resend later if a second
// coach lands on the app and needs self-serve reset by email.

export async function sendResetRequestEmail(
  coachName: string,
  confirmUrl: string,
): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(
    `\n[ass-istent] Password reset requested for "${coachName}".\n` +
      `Confirm and clear the password by visiting:\n  ${confirmUrl}\n` +
      `Link is valid for 24 hours.\n`,
  );
}
