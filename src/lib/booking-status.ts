export const BOOKING_STATUSES = ["new", "confirmed", "done", "cancelled"] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  done: "Done",
  cancelled: "Cancelled",
};

// Statuses that count toward the Concurrent booking limit.
export const ACTIVE_BOOKING_STATUSES: readonly BookingStatus[] = ["new", "confirmed"];

const NEXT: Record<BookingStatus, readonly BookingStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return NEXT[from].includes(to);
}

export function canUserCancel(status: BookingStatus): boolean {
  return status === "new";
}
