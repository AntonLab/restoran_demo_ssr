import { z } from "zod";
import { nameField, phoneField } from "@/lib/auth-schemas";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-status";
import { normalizePhone } from "@/server/auth/phone";

export const ORDERS_PAGE_SIZE = 10;

const address = z
  .string()
  .trim()
  .min(5, "Enter a delivery address (5 to 200 characters).")
  .max(200, "Enter a delivery address (5 to 200 characters).");

export const checkoutSchema = z.object({
  name: nameField,
  phone: phoneField,
  address,
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a delivery date."),
  deliveryTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a delivery time."),
  expectedTotalCents: z
    .string()
    .regex(/^\d{1,9}$/, "The order total is invalid.")
    .transform(Number),
  saveTemplate: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export const templateSchema = z.object({ name: nameField, phone: phoneField, address });

export type Contact = { name: string; phone: string; address: string };

export function sameContact(a: Contact, b: Contact): boolean {
  const norm = (c: Contact) => [c.name.trim(), normalizePhone(c.phone), c.address.trim()];
  return norm(a).join("\n") === norm(b).join("\n");
}

export type OrderFilters = {
  from: string | null;
  to: string | null;
  status: OrderStatus | null;
  dish: string;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Date.UTC rolls 2026-02-30 over to March, so the round trip rejects it.
function toDate(v: string | string[] | undefined): string | null {
  const s = first(v);
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10) === s ? s : null;
}

export function parseOrderFilters(sp: SearchParams): OrderFilters {
  let from = toDate(sp.from);
  let to = toDate(sp.to);
  if (from && to && from > to) [from, to] = [to, from];
  const status = first(sp.status);
  const page = first(sp.page);
  return {
    from,
    to,
    status: ORDER_STATUSES.find((s) => s === status) ?? null,
    dish: (first(sp.dish) ?? "").trim().slice(0, 80),
    page: page && /^[1-9]\d{0,8}$/.test(page) ? Number(page) : 1,
  };
}

export function serializeOrderFilters(f: OrderFilters): string {
  const p = new URLSearchParams();
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.status) p.set("status", f.status);
  if (f.dish) p.set("dish", f.dish);
  if (f.page > 1) p.set("page", String(f.page));
  return p.toString();
}
