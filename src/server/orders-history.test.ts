import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import type { OrderFilters } from "@/lib/order-schemas";
import { Order } from "@/server/models/order";
import { listUserOrders } from "@/server/orders";
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
const filters = (patch: Partial<OrderFilters> = {}): OrderFilters => ({
  from: null,
  to: null,
  status: null,
  dish: "",
  page: 1,
  ...patch,
});

describe("listUserOrders", () => {
  test("returns only the User's Orders, newest first, with a row shape", async () => {
    const u = uid();
    await mkOrder(u, { createdAt: new Date("2026-10-01T10:00:00Z") });
    await mkOrder(u, { createdAt: new Date("2026-10-02T10:00:00Z") });
    await mkOrder(uid());
    await mkOrder(null);
    const page = await listUserOrders(u, filters(), "UTC");
    expect(page.orders.map((o) => o.number)).toEqual([2, 1]);
    expect(page.orders[0]).toMatchObject({
      status: "new",
      totalCents: 1700,
      items: [{ name: "Borscht", qty: 2 }],
    });
    expect(page).toMatchObject({ total: 2, page: 1, pageCount: 1 });
  });
  test("paginates 10 per page and a page past the last is empty", async () => {
    const u = uid();
    for (let i = 0; i < 12; i++) await mkOrder(u);
    expect((await listUserOrders(u, filters(), "UTC")).orders).toHaveLength(10);
    const second = await listUserOrders(u, filters({ page: 2 }), "UTC");
    expect(second.orders).toHaveLength(2);
    const past = await listUserOrders(u, filters({ page: 9 }), "UTC");
    expect(past).toMatchObject({ orders: [], total: 12, pageCount: 2 });
  });
  test("filters by status and by Dish name, case-insensitively, with regex characters safe", async () => {
    const u = uid();
    await mkOrder(u, { status: "cancelled" });
    await mkOrder(u, {
      items: [{ dishId: oid(), nameSnapshot: "Soup (hot)", priceCentsSnapshot: 500, qty: 1 }],
    });
    expect((await listUserOrders(u, filters({ status: "cancelled" }), "UTC")).total).toBe(1);
    expect((await listUserOrders(u, filters({ dish: "BORS" }), "UTC")).total).toBe(1);
    expect((await listUserOrders(u, filters({ dish: "(hot" }), "UTC")).total).toBe(1);
    for (const dish of ["(", "*", "\\", "[a"]) {
      await expect(listUserOrders(u, filters({ dish }), "UTC")).resolves.toHaveProperty("total");
    }
  });
  test("the date range is whole days in the venue timezone, end day included", async () => {
    const u = uid();
    await mkOrder(u, { createdAt: new Date("2026-10-11T14:59:00Z") }); // 10-11 23:59 Tokyo
    await mkOrder(u, { createdAt: new Date("2026-10-11T15:00:00Z") }); // 10-12 00:00 Tokyo
    await mkOrder(u, { createdAt: new Date("2026-10-12T14:59:00Z") }); // 10-12 23:59 Tokyo
    await mkOrder(u, { createdAt: new Date("2026-10-12T15:00:00Z") }); // 10-13 00:00 Tokyo
    const page = await listUserOrders(
      u,
      filters({ from: "2026-10-12", to: "2026-10-12" }),
      "Asia/Tokyo",
    );
    expect(page.orders.map((o) => o.number).toSorted()).toEqual([2, 3]);
  });
  test("an invalid User id gives an empty page", async () => {
    expect(await listUserOrders("nope", filters(), "UTC")).toMatchObject({ orders: [], total: 0 });
  });
});
