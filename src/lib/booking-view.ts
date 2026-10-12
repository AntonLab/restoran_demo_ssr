import { serializeBookingFilters, type BookingTab } from "@/lib/booking-schemas";
import { canUserCancel } from "@/lib/booking-status";
import type { BookingRow } from "@/server/bookings";

const BASE = "/account/bookings";

const withQuery = (query: string) => (query ? `${BASE}?${query}` : BASE);

export function bookingTabHref(tab: BookingTab): string {
  return withQuery(serializeBookingFilters({ tab, page: 1 }));
}

export type BookingTableRow = BookingRow & { cancellable: boolean };

// Server-side: a client component reading the clock during render is impure.
export function withCancellable(rows: BookingRow[], now: Date): BookingTableRow[] {
  return rows.map((r) => ({
    ...r,
    cancellable: canUserCancel(r.status) && r.startsAt.getTime() > now.getTime(),
  }));
}
