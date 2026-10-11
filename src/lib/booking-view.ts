import {
  serializeBookingFilters,
  type BookingFilters,
  type BookingTab,
} from "@/lib/booking-schemas";
import { BOOKING_STATUS_LABELS, canUserCancel, type BookingStatus } from "@/lib/booking-status";
import type { BookingRow } from "@/server/bookings";

export function bookingCancelFailureText(error: string, status?: BookingStatus): string {
  if (!status) return error;
  return `${error.replace(/\.$/, "")}. Current status: ${BOOKING_STATUS_LABELS[status]}.`;
}

const BASE = "/account/bookings";

const withQuery = (query: string) => (query ? `${BASE}?${query}` : BASE);

export function bookingTabHref(tab: BookingTab): string {
  return withQuery(serializeBookingFilters({ tab, page: 1 }));
}

export function bookingPageHrefs(
  f: BookingFilters,
  pageCount: number,
): { prev: string | null; next: string | null } {
  const href = (page: number) => withQuery(serializeBookingFilters({ ...f, page }));
  return {
    prev: f.page > 1 ? href(Math.min(f.page - 1, pageCount)) : null,
    next: f.page < pageCount ? href(f.page + 1) : null,
  };
}

export type BookingTableRow = BookingRow & { cancellable: boolean };

// Computed on the server: a client component reading the clock during render is impure.
export function withCancellable(rows: BookingRow[], now: Date): BookingTableRow[] {
  return rows.map((r) => ({
    ...r,
    cancellable: canUserCancel(r.status) && r.startsAt.getTime() > now.getTime(),
  }));
}
