import { z } from "zod";
import { nameField, phoneField } from "@/lib/auth-schemas";

export const BOOKINGS_PAGE_SIZE = 10;

export const bookingSchema = z.object({
  name: nameField,
  phone: phoneField,
  guests: z
    .string()
    .regex(/^([1-9]|1[0-2])$/, "Enter 1 to 12 guests.")
    .transform(Number),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a day."),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a time."),
  preorder: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  expectedTotalCents: z
    .string()
    .regex(/^\d{1,9}$/, "The order total is invalid.")
    .transform(Number)
    .optional(),
});

export type BookingTab = "upcoming" | "past";
export type BookingFilters = { tab: BookingTab; page: number };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseBookingFilters(
  sp: Record<string, string | string[] | undefined>,
): BookingFilters {
  const page = first(sp.page);
  return {
    tab: first(sp.tab) === "past" ? "past" : "upcoming",
    page: page && /^[1-9]\d{0,8}$/.test(page) ? Number(page) : 1,
  };
}

export function serializeBookingFilters(f: BookingFilters): string {
  const p = new URLSearchParams();
  if (f.tab === "past") p.set("tab", "past");
  if (f.page > 1) p.set("page", String(f.page));
  return p.toString();
}
