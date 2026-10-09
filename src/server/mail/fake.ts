import type { MailDelivery, MailMessage } from "@/server/mail/types";

export function createFakeMail(): MailDelivery & { sent: MailMessage[] } {
  const sent: MailMessage[] = [];
  return {
    sent,
    async send(message) {
      sent.push(message);
    },
  };
}
