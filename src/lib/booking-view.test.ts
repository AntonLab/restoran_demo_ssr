import { describe, expect, test } from "vitest";
import {
  bookingCancelFailureText,
  bookingPageHrefs,
  bookingTabHref,
  withCancellable,
} from "@/lib/booking-view";
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

test("bookingCancelFailureText appends the fresh status only when there is one", () => {
  const error = "This booking can no longer be cancelled";
  expect(bookingCancelFailureText(error, "confirmed")).toBe(`${error}. Current status: Confirmed.`);
  expect(bookingCancelFailureText("Booking not found.")).toBe("Booking not found.");
});

test("bookingTabHref keeps Upcoming on the clean URL", () => {
  expect(bookingTabHref("upcoming")).toBe("/account/bookings");
  expect(bookingTabHref("past")).toBe("/account/bookings?tab=past");
});

describe("bookingPageHrefs", () => {
  test("the first page has only next", () => {
    expect(bookingPageHrefs({ tab: "upcoming", page: 1 }, 3)).toEqual({
      prev: null,
      next: "/account/bookings?page=2",
    });
  });
  test("a middle Past page links both ways and page 1 has a clean URL", () => {
    expect(bookingPageHrefs({ tab: "past", page: 2 }, 3)).toEqual({
      prev: "/account/bookings?tab=past",
      next: "/account/bookings?tab=past&page=3",
    });
  });
  test("a page past the end links back to the last page and has no next", () => {
    expect(bookingPageHrefs({ tab: "upcoming", page: 9 }, 3)).toEqual({
      prev: "/account/bookings?page=3",
      next: null,
    });
  });
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
