import { getEnv, type Env } from "@/server/env";
import type { MailDelivery } from "@/server/mail/types";

export function createMailDelivery(env: Pick<Env, "MAIL_DELIVERY">): MailDelivery {
  switch (env.MAIL_DELIVERY) {
    case "log":
      return {
        async send({ to, subject, text }) {
          console.info(`Mail to ${to}: ${subject}`);
          console.info(text);
        },
      };
  }
}

let cached: MailDelivery | undefined;

export function getMailDelivery(): MailDelivery {
  cached ??= createMailDelivery(getEnv());
  return cached;
}
