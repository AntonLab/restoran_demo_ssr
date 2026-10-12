import { describe, expect, test } from "vitest";
import { cancelFailureText, pageHrefs } from "@/lib/list-view";
import { serializeBookingFilters } from "@/lib/booking-schemas";
import { serializeOrderFilters } from "@/lib/order-schemas";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { BOOKING_STATUS_LABELS } from "@/lib/booking-status";

const none = { from: null, to: null, status: null, dish: "", page: 1 };
const orderHrefs = (f: typeof none, pageCount: number) =>
  pageHrefs(f, pageCount, "/account/orders", serializeOrderFilters);
const bookingHrefs = (f: { tab: "upcoming" | "past"; page: number }, pageCount: number) =>
  pageHrefs(f, pageCount, "/account/bookings", serializeBookingFilters);

describe("pageHrefs with order filters", () => {
  test("the first page has only next, and keeps the filters", () => {
    expect(orderHrefs({ ...none, dish: "tea" }, 3)).toEqual({
      prev: null,
      next: "/account/orders?dish=tea&page=2",
    });
  });
  test("a middle page links both ways and page 1 has a clean URL", () => {
    expect(orderHrefs({ ...none, page: 2 }, 3)).toEqual({
      prev: "/account/orders",
      next: "/account/orders?page=3",
    });
  });
  test("a page past the last links back to the last page, with no next", () => {
    expect(orderHrefs({ ...none, page: 9 }, 3)).toEqual({
      prev: "/account/orders?page=3",
      next: null,
    });
  });
});

describe("pageHrefs with booking filters", () => {
  test("the first page has only next", () => {
    expect(bookingHrefs({ tab: "upcoming", page: 1 }, 3)).toEqual({
      prev: null,
      next: "/account/bookings?page=2",
    });
  });
  test("a middle Past page links both ways and page 1 has a clean URL", () => {
    expect(bookingHrefs({ tab: "past", page: 2 }, 3)).toEqual({
      prev: "/account/bookings?tab=past",
      next: "/account/bookings?tab=past&page=3",
    });
  });
  test("a page past the end links back to the last page and has no next", () => {
    expect(bookingHrefs({ tab: "upcoming", page: 9 }, 3)).toEqual({
      prev: "/account/bookings?page=3",
      next: null,
    });
  });
});

describe("cancelFailureText", () => {
  test("adds the fresh status when the server sent one", () => {
    expect(
      cancelFailureText(ORDER_STATUS_LABELS, "This order can no longer be cancelled", "accepted"),
    ).toBe("This order can no longer be cancelled. Current status: Accepted.");
    expect(
      cancelFailureText(
        BOOKING_STATUS_LABELS,
        "This booking can no longer be cancelled",
        "confirmed",
      ),
    ).toBe("This booking can no longer be cancelled. Current status: Confirmed.");
  });
  test("returns the server text unchanged without a status", () => {
    expect(cancelFailureText(ORDER_STATUS_LABELS, "Order not found.")).toBe("Order not found.");
  });
  test("does not double a trailing period", () => {
    expect(cancelFailureText(ORDER_STATUS_LABELS, "Order not found.", "cancelled")).toBe(
      "Order not found. Current status: Cancelled.",
    );
  });
});
