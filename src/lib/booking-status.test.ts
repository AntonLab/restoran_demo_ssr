import { describe, expect, test } from "vitest";
import {
  BOOKING_STATUSES,
  canTransition,
  canUserCancel,
  type BookingStatus,
} from "@/lib/booking-status";

const ALLOWED: Record<BookingStatus, BookingStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

describe("canTransition", () => {
  for (const from of BOOKING_STATUSES) {
    for (const to of BOOKING_STATUSES) {
      test(`${from} -> ${to}`, () => {
        expect(canTransition(from, to)).toBe(ALLOWED[from].includes(to));
      });
    }
  }
});

describe("canUserCancel", () => {
  test("only a new Booking", () => {
    expect(BOOKING_STATUSES.filter(canUserCancel)).toEqual(["new"]);
  });
});
