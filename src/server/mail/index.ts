import type { MailMessage } from "@/server/mail/types";

// The mail emulator: no SMTP, the email goes to the server log.
export async function sendMail({ to, subject, text }: MailMessage): Promise<void> {
  console.info(`Mail to ${to}: ${subject}`);
  console.info(text);
}
