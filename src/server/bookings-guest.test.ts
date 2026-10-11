import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { attachGuestBookings, getBookingConfirmation } from "@/server/bookings";
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

const uid = () => String(new mongoose.Types.ObjectId());
const mk = (userId: string | null, patch: Record<string, unknown> = {}) =>
  Booking.create({
    number: ++seq,
    userId,
    contact: { name: "Ann", phone: "+15551234567" },
    startsAt: new Date("2030-01-01T12:00:00Z"),
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
    history: [{ status: "new", at: new Date() }],
    ...patch,
  });

describe("getBookingConfirmation", () => {
  test("a Guest sees a Booking by Number, without the phone", async () => {
    await mk(null);
    const r = await getBookingConfirmation(1, null);
    expect(r).toMatchObject({
      number: 1,
      guests: 2,
      totalCents: 1000,
      mine: false,
      items: [{ name: "Borscht", qty: 2 }],
    });
    expect(r).not.toHaveProperty("contact");
  });
  test("a User sees only their own Booking", async () => {
    const u = uid();
    await mk(u);
    await mk(uid());
    expect(await getBookingConfirmation(1, u)).toMatchObject({ mine: true });
    expect(await getBookingConfirmation(2, u)).toBeNull();
  });
  test("an unknown or non-integer Number is null", async () => {
    expect(await getBookingConfirmation(5, null)).toBeNull();
    expect(await getBookingConfirmation(1.5, null)).toBeNull();
  });
});

describe("attachGuestBookings", () => {
  test("gives Guest Bookings with the same phone to the User and leaves others alone", async () => {
    const u = uid();
    const other = uid();
    await mk(null); // 1: same phone, Guest
    await mk(other); // 2: same phone, other User
    await mk(null, { contact: { name: "Bob", phone: "+15559999999" } }); // 3
    expect(await attachGuestBookings(u, "+15551234567")).toBe(1);
    expect(String((await Booking.findOne({ number: 1 }).lean())?.userId)).toBe(u);
    expect(String((await Booking.findOne({ number: 2 }).lean())?.userId)).toBe(other);
    expect((await Booking.findOne({ number: 3 }).lean())?.userId).toBeNull();
  });
  test("a malformed phone or user id attaches nothing", async () => {
    await mk(null);
    expect(await attachGuestBookings(uid(), "12")).toBe(0);
    expect(await attachGuestBookings("nope", "+15551234567")).toBe(0);
  });
});
