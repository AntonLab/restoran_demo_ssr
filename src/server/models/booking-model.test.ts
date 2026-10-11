import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { Booking } from "@/server/models/booking";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(async () => {
  await startTestDb();
  await Booking.init();
});
afterAll(stopTestDb);
beforeEach(clearTestDb);

const valid = (patch: Record<string, unknown> = {}) => ({
  number: 1,
  contact: { name: "Ann", phone: "5551234567" },
  startsAt: new Date("2026-10-13T12:00:00Z"),
  guests: 2,
  items: [],
  totalCents: 0,
  status: "new" as const,
  history: [{ status: "new" as const, at: new Date("2026-10-12T10:00:00Z") }],
  ...patch,
});

describe("Booking model", () => {
  test("stores a Booking with no Pre-order and a null userId", async () => {
    const saved = await Booking.create(valid());
    expect(saved.items).toHaveLength(0);
    expect(saved.userId).toBeNull();
  });
  test("number is unique", async () => {
    await Booking.create(valid());
    await expect(Booking.create(valid())).rejects.toThrow(/duplicate key/);
  });
  test.each([0, 13, 1.5])("rejects guests %s", async (guests) => {
    await expect(Booking.create(valid({ guests }))).rejects.toThrow();
  });
  test("rejects an unknown status", async () => {
    await expect(Booking.create(valid({ status: "paid" }))).rejects.toThrow();
  });
  test("keeps the owner id", async () => {
    const userId = new mongoose.Types.ObjectId();
    const saved = await Booking.create(valid({ userId }));
    expect(String(saved.userId)).toBe(String(userId));
  });
});
