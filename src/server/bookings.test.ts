import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { guestCartKey } from "@/server/cart";
import { Booking } from "@/server/models/booking";
import { Counter } from "@/server/models/counter";
import { placeBooking, type PlaceBookingResult } from "@/server/bookings";
import type { OrderContext } from "@/server/orders";
import { createRateLimiter } from "@/server/rate-limit";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";
import { WEEKDAYS } from "@/lib/weekdays";

vi.mock("@/server/queries/settings", () => ({
  getSettings: async () => ({
    timezone: "UTC",
    maxConcurrentBookings: 2,
    schedule: WEEKDAYS.map((day) => ({
      day,
      open: "09:00",
      close: "22:00",
      closed: day === "Sun",
    })),
  }),
}));

beforeAll(async () => {
  await startTestDb();
  await Promise.all([Booking.init(), Counter.init()]);
});
afterAll(stopTestDb);
beforeEach(clearTestDb);

const NOW = new Date("2026-10-12T10:07:00Z");
const fresh = (limit = 100) => createRateLimiter({ limit, windowMs: 3_600_000 });
const guest: OrderContext = {
  ownerKey: guestCartKey("3f2b8c1e-9d4a-4e6b-8a1c-0d5e7f9a2b34"),
  userId: null,
  role: "guest",
  ip: "1.1.1.1",
};
const input = (patch: Record<string, string> = {}) => ({
  name: "Ann",
  phone: "5551234567",
  guests: "2",
  date: "2026-10-13",
  time: "12:00",
  ...patch,
});
const place = (patch?: Record<string, string>, ctx = guest, limiter = fresh()) =>
  placeBooking(input(patch), ctx, limiter, NOW);

describe("placeBooking", () => {
  test("creates a new Booking with history and an increasing Number", async () => {
    const a = await place();
    const b = await place({ time: "15:00" });
    expect(a).toEqual({ ok: true, number: 1 });
    expect(b).toEqual({ ok: true, number: 2 });
    const saved = await Booking.findOne({ number: 1 }).lean();
    expect(saved).toMatchObject({
      status: "new",
      guests: 2,
      items: [],
      totalCents: 0,
      userId: null,
    });
    expect(saved?.startsAt).toEqual(new Date("2026-10-13T12:00:00Z"));
    expect(saved?.history).toEqual([{ status: "new", at: NOW }]);
  });
  test("refuses a Slot outside the Schedule, off-grid or too soon", async () => {
    const patches: Record<string, string>[] = [
      { time: "21:00" },
      { time: "12:15" },
      { date: "2026-10-18" },
      { date: "2026-10-12", time: "11:00" },
    ];
    for (const patch of patches) {
      const r = await place(patch);
      expect(r).toMatchObject({ ok: false });
    }
    expect(await Booking.countDocuments()).toBe(0);
  });
  test("refuses garbage input with field errors", async () => {
    const r = await place({ guests: "13", date: "2026-02-30" });
    expect(r).toMatchObject({ ok: false, fieldErrors: { guests: expect.any(Array) } });
  });
  test("refuses an Admin", async () => {
    const r = await place({}, { ...guest, role: "admin" });
    expect(r).toEqual({ ok: false, error: "Admins cannot book a table." });
  });
  test("refuses at the limit; cancelled and done do not count", async () => {
    await place();
    await place();
    const full = await place();
    expect(full).toMatchObject({
      ok: false,
      fieldErrors: { time: ["This time is fully booked, pick another"] },
    });
    await Booking.updateOne({ number: 1 }, { status: "cancelled" });
    await Booking.updateOne({ number: 2 }, { status: "done" });
    expect(await place()).toMatchObject({ ok: true });
  });
  test("two parallel calls for the last place create exactly one Booking", async () => {
    await place();
    const results: PlaceBookingResult[] = await Promise.all([place(), place()]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await Booking.countDocuments()).toBe(2);
  });
  test("rate limit: the 6th Booking from one IP in an hour is refused", async () => {
    const limiter = fresh(5);
    // Spread over disjoint Slots so the Concurrent booking limit (2) never trips first.
    for (let i = 0; i < 5; i++)
      expect(
        await place({ time: `${String(9 + 2 * i).padStart(2, "0")}:00` }, guest, limiter),
      ).toMatchObject({ ok: true });
    expect(await place({ time: "09:00" }, guest, limiter)).toMatchObject({ ok: false });
  });
  test("allows a duplicate Booking on the same phone and Slot", async () => {
    expect(await place({ time: "10:00" })).toMatchObject({ ok: true });
    expect(await place({ time: "10:00" })).toMatchObject({ ok: true });
  });
});
