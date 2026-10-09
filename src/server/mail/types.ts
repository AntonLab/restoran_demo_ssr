export type MailMessage = { to: string; subject: string; text: string };

export type MailDelivery = { send(message: MailMessage): Promise<void> };
