import type { MailMessage } from "@/server/mail/types";

export function passwordResetMail({ to, link }: { to: string; link: string }): MailMessage {
  return {
    to,
    subject: "Reset your password",
    text: `Open this link to choose a new password. It is valid for 1 hour:\n\n${link}\n\nIf you did not ask for this, ignore this email.`,
  };
}
