import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { cancelUserBooking, listUserBookings } from "@/server/bookings";
import { Booking } from "@/server/models/booking";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(async () => {
  await startTestDb();
  await Booking.init();
});
afterAll(stopTestDb);
let seq = 0;
beforeEach(async () => {
  seq = 0;
  await clearTestDb();
});

const NOW = new Date("2026-10-12T10:00:00Z");
const hours = (h: number) => new Date(NOW.getTime() + h * 3_600_000);
const uid = () => String(new mongoose.Types.ObjectId());
const mk = (userId: string | null, patch: Record<string, unknown> = {}) =>
  Booking.create({
    number: ++seq,
    viewToken: `token-${seq}`,
    userId,
    contact: { name: "Ann", phone: "+15551234567" },
    startsAt: hours(24),
    guests: 2,
    items: [
      {
        dishId: new mongoose.Types.ObjectId(),
        nameSnapshot: "Borscht",
        priceCentsSnapshot: 500,
        qty: 2,
      },
    ],
    totalCents: 1000,
    status: "new",
    history: [{ status: "new", at: NOW }],
    ...patch,
  });
const upcoming = { tab: "upcoming", page: 1 } as const;
const past = { tab: "past", page: 1 } as const;

describe("listUserBookings", () => {
  test("Upcoming: startsAt >= now, soonest first, only the User's; Past: newest first", async () => {
    const u = uid();
    await mk(u, { startsAt: hours(48) }); // 1
    await mk(u, { startsAt: hours(2) }); // 2
    await mk(u, { startsAt: hours(0) }); // 3: starts exactly now -> Upcoming
    await mk(u, { startsAt: hours(-5), status: "done" }); // 4
    await mk(u, { startsAt: hours(-1), status: "cancelled" }); // 5
    await mk(uid(), { startsAt: hours(3) }); // 6: another User
    await mk(null, { startsAt: hours(3) }); // 7: Guest
    const up = await listUserBookings(u, upcoming, NOW);
    expect(up.bookings.map((b) => b.number)).toEqual([3, 2, 1]);
    expect(up.total).toBe(3);
    const old = await listUserBookings(u, past, NOW);
    expect(old.bookings.map((b) => b.number)).toEqual([5, 4]);
  });
  test("maps the Pre-order and paginates by 10", async () => {
    const u = uid();
    for (let i = 0; i < 12; i++) await mk(u, { startsAt: hours(10 + i) });
    const first = await listUserBookings(u, upcoming, NOW);
    expect(first.bookings).toHaveLength(10);
    expect(first).toMatchObject({ total: 12, page: 1, pageCount: 2 });
    expect(first.bookings[0]).toMatchObject({
      items: [{ name: "Borscht", qty: 2 }],
      totalCents: 1000,
      status: "new",
    });
    expect((await listUserBookings(u, { tab: "upcoming", page: 2 }, NOW)).bookings).toHaveLength(2);
    expect((await listUserBookings(u, { tab: "upcoming", page: 9 }, NOW)).bookings).toHaveLength(0);
  });
  test("a malformed user id yields an empty page", async () => {
    expect(await listUserBookings("nope", upcoming, NOW)).toMatchObject({
      bookings: [],
      total: 0,
      pageCount: 1,
    });
  });
});

describe("cancelUserBooking", () => {
  test("cancels a new Booking before it starts and records the User in history", async () => {
    const u = uid();
    await mk(u);
    expect(await cancelUserBooking(u, 1, NOW)).toEqual({ ok: true });
    const saved = await Booking.findOne({ number: 1 }).lean();
    expect(saved?.status).toBe("cancelled");
    expect(saved?.history.at(-1)).toEqual({ status: "cancelled", at: NOW, by: "user" });
  });
  test("refuses a confirmed Booking and returns the fresh status", async () => {
    const u = uid();
    await mk(u, { status: "confirmed" });
    expect(await cancelUserBooking(u, 1, NOW)).toEqual({
      ok: false,
      error: "This booking can no longer be cancelled",
      status: "confirmed",
    });
  });
  test("refuses a new Booking that has started", async () => {
    const u = uid();
    await mk(u, { startsAt: hours(-1) });
    expect(await cancelUserBooking(u, 1, NOW)).toMatchObject({ ok: false, status: "new" });
    expect((await Booking.findOne().lean())?.status).toBe("new");
  });
  test("another User's, unknown and invalid numbers are not found", async () => {
    await mk(uid());
    const notFound = { ok: false, error: "Booking not found." };
    expect(await cancelUserBooking(uid(), 1, NOW)).toEqual(notFound);
    expect(await cancelUserBooking(uid(), 99, NOW)).toEqual(notFound);
    expect(await cancelUserBooking("nope", 1, NOW)).toEqual(notFound);
    expect(await cancelUserBooking(uid(), 1.5, NOW)).toEqual(notFound);
  });
});
