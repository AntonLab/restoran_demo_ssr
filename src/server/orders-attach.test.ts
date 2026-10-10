import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { Order } from "@/server/models/order";
import { attachGuestOrders } from "@/server/orders";
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

const PHONE = "+15551234567";

describe("attachGuestOrders", () => {
  test("attaches Guest Orders with the same phone and leaves the rest alone", async () => {
    const u = uid();
    const other = uid();
    await mkOrder(null); // same phone, Guest
    await mkOrder(null, { customer: { name: "Bob", phone: "+15559990000" } });
    await mkOrder(other); // same phone, already owned
    expect(await attachGuestOrders(u, PHONE)).toBe(1);
    const owners = (await Order.find().sort({ number: 1 }).lean()).map((o) => String(o.userId));
    expect(owners).toEqual([u, "null", other]);
  });
  test.each(["", "   ", "abc"])("phone %j attaches nothing", async (phone) => {
    await mkOrder(null);
    expect(await attachGuestOrders(uid(), phone)).toBe(0);
    expect(await Order.countDocuments({ userId: null })).toBe(1);
  });
  test("an invalid User id attaches nothing", async () => {
    await mkOrder(null);
    expect(await attachGuestOrders("nope", PHONE)).toBe(0);
  });
  test("a second call attaches nothing more", async () => {
    const u = uid();
    await mkOrder(null);
    await attachGuestOrders(u, PHONE);
    expect(await attachGuestOrders(uid(), PHONE)).toBe(0);
  });
});
