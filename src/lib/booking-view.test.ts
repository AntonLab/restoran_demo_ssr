import { describe, expect, test } from "vitest";
import { bookingTabHref, withCancellable } from "@/lib/booking-view";
import type { BookingRow } from "@/server/bookings";

const NOW = new Date("2026-10-12T10:00:00Z");
const row = (patch: Partial<BookingRow>): BookingRow => ({
  id: "1",
  number: 1,
  startsAt: new Date("2026-10-13T18:00:00Z"),
  guests: 2,
  items: [],
  totalCents: 0,
  status: "new",
  ...patch,
});

test("bookingTabHref keeps Upcoming on the clean URL", () => {
  expect(bookingTabHref("upcoming")).toBe("/account/bookings");
  expect(bookingTabHref("past")).toBe("/account/bookings?tab=past");
});

describe("withCancellable", () => {
  test("only a new Booking that starts after now can be cancelled", () => {
    const rows = withCancellable(
      [
        row({ number: 1 }),
        row({ number: 2, status: "confirmed" }),
        row({ number: 3, startsAt: new Date("2026-10-12T09:00:00Z") }),
        row({ number: 4, startsAt: NOW }),
        row({ number: 5, status: "cancelled" }),
      ],
      NOW,
    );
    expect(rows.map((r) => r.cancellable)).toEqual([true, false, false, false, false]);
  });
  test("keeps every other field", () => {
    expect(withCancellable([row({ guests: 5 })], NOW)[0]).toMatchObject({ guests: 5, number: 1 });
  });
});
