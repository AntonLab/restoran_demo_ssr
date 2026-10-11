import { describe, expect, test } from "vitest";
import { bookingSchema, parseBookingFilters, serializeBookingFilters } from "@/lib/booking-schemas";

const valid = {
  name: " Ann ",
  phone: "+1 (555) 123-4567",
  guests: "4",
  date: "2026-10-13",
  time: "18:30",
};

describe("bookingSchema", () => {
  test("parses and normalizes", () => {
    const r = bookingSchema.safeParse(valid);
    expect(r.success && r.data).toMatchObject({
      name: "Ann",
      phone: "+15551234567",
      guests: 4,
      date: "2026-10-13",
      time: "18:30",
      preorder: false,
    });
  });
  test.each(["0", "13", "abc", "1.5", "", "-1"])("rejects guests %j", (guests) => {
    const r = bookingSchema.safeParse({ ...valid, guests });
    expect(r.success).toBe(false);
  });
  test.each(["2026-1-3", "13/10/2026", ""])("rejects date %j", (date) => {
    expect(bookingSchema.safeParse({ ...valid, date }).success).toBe(false);
  });
  test.each(["25:00", "18:60", "6pm", ""])("rejects time %j", (time) => {
    expect(bookingSchema.safeParse({ ...valid, time }).success).toBe(false);
  });
  test("rejects a short phone and an empty name", () => {
    expect(bookingSchema.safeParse({ ...valid, phone: "12" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, name: "  " }).success).toBe(false);
  });
  test("preorder is true for on or true, and carries the expected total", () => {
    const r = bookingSchema.safeParse({ ...valid, preorder: "on", expectedTotalCents: "1250" });
    expect(r.success && r.data).toMatchObject({ preorder: true, expectedTotalCents: 1250 });
    expect(bookingSchema.safeParse({ ...valid, preorder: "true" }).data?.preorder).toBe(true);
  });
  test("with Pre-order off, parses with no expected total", () => {
    const r = bookingSchema.safeParse(valid);
    expect(r.success && r.data).toMatchObject({ preorder: false });
    expect(r.data).not.toHaveProperty("expectedTotalCents");
  });
  test("accepts a 9-digit expected total and rejects a 10-digit one", () => {
    expect(bookingSchema.safeParse({ ...valid, expectedTotalCents: "999999999" }).success).toBe(
      true,
    );
    expect(bookingSchema.safeParse({ ...valid, expectedTotalCents: "1000000000" }).success).toBe(
      false,
    );
  });
  test("rejects a malformed expected total", () => {
    expect(bookingSchema.safeParse({ ...valid, expectedTotalCents: "12.5" }).success).toBe(false);
  });
});

describe("booking filters", () => {
  test("defaults to upcoming page 1", () => {
    expect(parseBookingFilters({})).toEqual({ tab: "upcoming", page: 1 });
  });
  test("reads tab and page, ignores junk", () => {
    expect(parseBookingFilters({ tab: "past", page: "3" })).toEqual({ tab: "past", page: 3 });
    expect(parseBookingFilters({ tab: "x", page: "0" })).toEqual({ tab: "upcoming", page: 1 });
    expect(parseBookingFilters({ page: ["2", "5"] }).page).toBe(2);
  });
  test("serializes without defaults", () => {
    expect(serializeBookingFilters({ tab: "upcoming", page: 1 })).toBe("");
    expect(serializeBookingFilters({ tab: "past", page: 2 })).toBe("tab=past&page=2");
  });
});
