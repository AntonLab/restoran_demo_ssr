import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { Order } from "@/server/models/order";
import { cancelUserOrder, getOrderConfirmation } from "@/server/orders";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(async () => {
  await startTestDb();
  await Order.init();
});
afterAll(stopTestDb);
let seq = 0;
beforeEach(async () => {
  seq = 0;
  await clearTestDb();
});

const oid = () => new mongoose.Types.ObjectId();
const uid = () => String(oid());
const mkOrder = (userId: string | null, patch: Record<string, unknown> = {}) =>
  Order.create({
    number: ++seq,
    userId,
    customer: { name: "Ann", phone: "+15551234567" },
    address: "12 Main Street",
    deliveryAt: new Date("2026-10-20T12:00:00Z"),
    items: [{ dishId: oid(), nameSnapshot: "Borscht", priceCentsSnapshot: 850, qty: 2 }],
    totalCents: 1700,
    status: "new",
    history: [{ status: "new", at: new Date() }],
    ...patch,
  });

const NOW = new Date("2026-10-12T10:00:00Z");

describe("cancelUserOrder", () => {
  test("cancels a new Order of the User and records who did it", async () => {
    const u = uid();
    await mkOrder(u);
    expect(await cancelUserOrder(u, 1, NOW)).toEqual({ ok: true });
    const order = (await Order.findOne({ number: 1 }).lean())!;
    expect(order.status).toBe("cancelled");
    expect(order.history).toHaveLength(2);
    expect(order.history[1]).toMatchObject({ status: "cancelled", by: "user", at: NOW });
  });
  test.each(["accepted", "delivery", "completed", "cancelled"] as const)(
    "refuses a %s Order and reports the fresh status",
    async (status) => {
      const u = uid();
      await mkOrder(u, { status });
      expect(await cancelUserOrder(u, 1, NOW)).toEqual({
        ok: false,
        error: "This order can no longer be cancelled",
        status,
      });
      expect((await Order.findOne({ number: 1 }).lean())!.history).toHaveLength(1);
    },
  );
  test("another User's, a Guest's, a missing and a non-integer Number are not found", async () => {
    const u = uid();
    await mkOrder(uid());
    await mkOrder(null);
    for (const n of [1, 2, 99, 1.5, Number.NaN, -1]) {
      expect(await cancelUserOrder(u, n, NOW)).toEqual({ ok: false, error: "Order not found." });
    }
    expect(await Order.countDocuments({ status: "cancelled" })).toBe(0);
  });
  test("two cancels race: one wins, one history entry", async () => {
    const u = uid();
    await mkOrder(u);
    const [a, b] = await Promise.all([cancelUserOrder(u, 1, NOW), cancelUserOrder(u, 1, NOW)]);
    expect([a.ok, b.ok].toSorted()).toEqual([false, true]);
    expect((await Order.findOne({ number: 1 }).lean())!.history).toHaveLength(2);
  });
});

describe("getOrderConfirmation", () => {
  test("returns Number and total, and whether the viewer owns it", async () => {
    const u = uid();
    await mkOrder(u);
    await mkOrder(null);
    expect(await getOrderConfirmation(1, u)).toEqual({ number: 1, totalCents: 1700, mine: true });
    expect(await getOrderConfirmation(1, uid())).toMatchObject({ mine: false });
    expect(await getOrderConfirmation(2, null)).toMatchObject({ mine: false });
    expect(await getOrderConfirmation(2, u)).toMatchObject({ mine: false });
  });
  test("an unknown or non-integer Number is null", async () => {
    expect(await getOrderConfirmation(7, null)).toBeNull();
    expect(await getOrderConfirmation(1.5, null)).toBeNull();
  });
});
