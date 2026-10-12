import { sameContact, type Contact } from "@/lib/order-schemas";

export type TemplateView = Contact & { id: string };
export type SaveOffer = "none" | "limit" | "offer";

export function saveOffer(input: {
  isUser: boolean;
  atLimit: boolean;
  templates: Contact[];
  current: Contact;
}): SaveOffer {
  if (!input.isUser) return "none";
  if (input.templates.some((t) => sameContact(t, input.current))) return "none";
  return input.atLimit ? "limit" : "offer";
}
