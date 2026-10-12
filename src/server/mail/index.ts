import type { MailMessage } from "@/server/mail/types";

// No SMTP: mail is logged.
export async function sendMail({ to, subject, text }: MailMessage): Promise<void> {
  console.info(`Mail to ${to}: ${subject}`);
  console.info(text);
}
