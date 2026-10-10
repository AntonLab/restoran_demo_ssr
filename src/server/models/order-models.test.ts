import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { Cart } from "@/server/models/cart";
import { Order } from "@/server/models/order";
import { OrderTemplate } from "@/server/models/order-template";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(async () => {
  await startTestDb();
  await Promise.all([Cart.init(), Order.init(), OrderTemplate.init()]);
});
afterAll(stopTestDb);
beforeEach(clearTestDb);

const oid = () => new mongoose.Types.ObjectId();
const id = () => String(oid());
const line = (qty = 1) => ({ dishId: oid(), qty });
const orderData = (patch: Record<string, unknown> = {}) => ({
  number: 1,
  customer: { name: "Ann", phone: "+15551234567" },
  address: "12 Main St",
  deliveryAt: new Date(),
  items: [{ dishId: oid(), nameSnapshot: "Borscht", priceCentsSnapshot: 850, qty: 2 }],
  totalCents: 1700,
  status: "new" as const,
  history: [{ status: "new" as const, at: new Date() }],
  ...patch,
});

describe("Cart", () => {
  test("ownerKey is unique", async () => {
    await Cart.create({ ownerKey: "guest:a", guest: true, items: [] });
    await expect(
      Cart.create({ ownerKey: "guest:a", guest: true, items: [] }),
    ).rejects.toMatchObject({ code: 11000 });
  });
  test.each([0, 21, 1.5])("rejects qty %s", async (qty) => {
    await expect(
      Cart.create({ ownerKey: `user:${id()}`, guest: false, items: [line(qty)] }),
    ).rejects.toThrow();
  });
  test("rejects more than 30 lines", async () => {
    const items = Array.from({ length: 31 }, () => line());
    await expect(Cart.create({ ownerKey: "guest:b", guest: true, items })).rejects.toThrow();
  });
  test("has a 30-day TTL index on updatedAt limited to guest carts", async () => {
    const indexes = await Cart.collection.indexes();
    const ttl = indexes.find((i) => i.key.updatedAt === 1);
    expect(ttl?.expireAfterSeconds).toBe(2_592_000);
    expect(ttl?.partialFilterExpression).toEqual({ guest: true });
  });
});

describe("Order", () => {
  test("number is unique and userId defaults to null", async () => {
    const first = await Order.create(orderData());
    expect(first.userId).toBeNull();
    await expect(Order.create(orderData())).rejects.toMatchObject({ code: 11000 });
  });
  test("rejects an unknown status and an Order without items", async () => {
    await expect(Order.create(orderData({ status: "bogus" }))).rejects.toThrow();
    await expect(Order.create(orderData({ number: 2, items: [] }))).rejects.toThrow();
  });
  test("indexes history lookups by user and by phone", async () => {
    const keys = (await Order.collection.indexes()).map((i) => JSON.stringify(i.key));
    expect(keys).toContain(JSON.stringify({ userId: 1, createdAt: -1 }));
    expect(keys).toContain(JSON.stringify({ "customer.phone": 1 }));
  });
});

test("OrderTemplate defaults lastUsedAt", async () => {
  const t = await OrderTemplate.create({
    userId: oid(),
    name: "Ann",
    phone: "+15551234567",
    address: "12 Main St",
  });
  expect(t.lastUsedAt).toBeInstanceOf(Date);
});
