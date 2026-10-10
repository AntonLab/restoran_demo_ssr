import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { WEEKDAYS } from "@/lib/weekdays";
import { addItem, getCart, guestCartKey, userCartKey } from "@/server/cart";
import { Cart } from "@/server/models/cart";
import { Category } from "@/server/models/category";
import { Dish } from "@/server/models/dish";
import { Order } from "@/server/models/order";
import { OrderTemplate } from "@/server/models/order-template";
import { placeOrder, type OrderContext } from "@/server/orders";
import { createRateLimiter } from "@/server/rate-limit";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

vi.mock("@/server/queries/settings", () => ({
  getSettings: async () => ({
    timezone: "UTC",
    schedule: WEEKDAYS.map((day) => ({ day, open: "09:00", close: "22:00", closed: false })),
  }),
}));

beforeAll(async () => {
  await startTestDb();
  await Order.init();
  await Cart.init();
});
afterAll(stopTestDb);
beforeEach(clearTestDb);

const uid = () => String(new mongoose.Types.ObjectId());
async function mkDish(patch: Record<string, unknown> = {}, categoryStatus = "active") {
  const category = await Category.create({
    name: `Soups ${new mongoose.Types.ObjectId()}`,
    status: categoryStatus as "active" | "inactive",
  });
  const dish = await Dish.create({
    name: "Soup",
    shortDescription: "s",
    fullDescription: "f",
    weight: "300 g",
    priceCents: 850,
    categoryId: category._id,
    ...patch,
  });
  return String(dish._id);
}

const NOW = new Date("2026-10-12T10:07:00Z"); // Monday; first slot today 11:15
const fresh = (limit = 100) => createRateLimiter({ limit, windowMs: 3_600_000 });
const guest = (cid = "abc"): OrderContext => ({
  ownerKey: guestCartKey(cid),
  userId: null,
  role: "guest",
  ip: "1.1.1.1",
});
const form = (patch: Record<string, unknown> = {}) => ({
  name: "Ann",
  phone: "+1 555 123 4567",
  address: "12 Main Street",
  deliveryDate: "2026-10-12",
  deliveryTime: "11:15",
  expectedTotalCents: "850",
  ...patch,
});
async function cartWith(ctx: OrderContext, ...dishes: string[]) {
  for (const d of dishes) await addItem(ctx.ownerKey!, d);
}
const place = (input: unknown, ctx: OrderContext, limiter = fresh()) =>
  placeOrder(input, ctx, limiter, NOW);

describe("placeOrder", () => {
  test("creates the Order with a Price snapshot and clears the Cart", async () => {
    const d = await mkDish({ name: "Borscht" });
    const ctx = guest();
    await cartWith(ctx, d);
    const r = await place(form(), ctx);
    expect(r).toEqual({ ok: true, number: 1, totalCents: 850 });
    const order = (await Order.findOne({ number: 1 }).lean())!;
    expect(order).toMatchObject({
      userId: null,
      address: "12 Main Street",
      status: "new",
      totalCents: 850,
      customer: { name: "Ann", phone: "+15551234567" },
      items: [{ nameSnapshot: "Borscht", priceCentsSnapshot: 850, qty: 1 }],
    });
    expect(order.history).toHaveLength(1);
    expect(order.history[0]).toMatchObject({ status: "new", at: NOW });
    expect(order.history[0]).not.toHaveProperty("by");
    expect(order.deliveryAt).toEqual(new Date("2026-10-12T11:15:00Z"));
    expect(await Cart.findOne({ ownerKey: ctx.ownerKey! })).toBeNull();
  });
  test("the snapshot survives a later price change and Numbers grow", async () => {
    const d = await mkDish();
    await cartWith(guest("a"), d);
    await place(form(), guest("a"));
    await Dish.updateOne({ _id: d }, { priceCents: 1200, name: "Renamed" });
    const order = (await Order.findOne({ number: 1 }).lean())!;
    expect(order.items[0]).toMatchObject({ nameSnapshot: "Soup", priceCentsSnapshot: 850 });
    await cartWith(guest("b"), d);
    expect(await place(form({ expectedTotalCents: "1200" }), guest("b"))).toMatchObject({
      ok: true,
      number: 2,
    });
  });
  test("a total different from the client's is refused and changes nothing", async () => {
    const d = await mkDish();
    const ctx = guest();
    await cartWith(ctx, d);
    const r = await place(form({ expectedTotalCents: "800" }), ctx);
    expect(r).toEqual({ ok: false, error: "Prices changed, review your cart" });
    expect(await Order.countDocuments()).toBe(0);
    expect((await getCart(ctx.ownerKey!)).lines).toHaveLength(1);
  });
  test("an unavailable item blocks the Order and is named", async () => {
    const d = await mkDish({ name: "Gazpacho" });
    const ctx = guest();
    await cartWith(ctx, d);
    await Dish.updateOne({ _id: d }, { inStock: false });
    const r = await place(form({ expectedTotalCents: "0" }), ctx);
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining("Gazpacho") });
    expect(await Order.countDocuments()).toBe(0);
  });
  test("an empty Cart, a missing Cart and a repeat submit are refused", async () => {
    const ctx = guest();
    expect(await place(form(), ctx)).toMatchObject({ ok: false, error: "Your cart is empty." });
    expect(await place(form(), { ...ctx, ownerKey: null })).toMatchObject({ ok: false });
    await cartWith(ctx, await mkDish());
    expect(await place(form(), ctx)).toMatchObject({ ok: true });
    expect(await place(form(), ctx)).toMatchObject({ ok: false, error: "Your cart is empty." });
    expect(await Order.countDocuments()).toBe(1);
  });
  test("a soft-deleted dish is dropped, not ordered", async () => {
    const [keep, gone] = [await mkDish(), await mkDish()];
    const ctx = guest();
    await cartWith(ctx, keep, gone);
    await Dish.updateOne({ _id: gone }, { deletedAt: new Date() });
    expect(await place(form(), ctx)).toMatchObject({ ok: true, totalCents: 850 });
    expect((await Order.findOne().lean())!.items).toHaveLength(1);
  });
  test("an Admin cannot place an Order", async () => {
    const ctx: OrderContext = {
      ownerKey: userCartKey(uid()),
      userId: uid(),
      role: "admin",
      ip: "1.1.1.1",
    };
    await cartWith(ctx, await mkDish());
    expect(await place(form(), ctx)).toMatchObject({ ok: false });
    expect(await Order.countDocuments()).toBe(0);
  });
  test.each([
    ["a blank name", { name: "   " }],
    ["a blank address", { address: "      " }],
    ["a text total", { expectedTotalCents: "abc" }],
    ["an empty total", { expectedTotalCents: "" }],
    ["a bad date", { deliveryDate: "tomorrow" }],
  ])("%s gives field errors, not a throw", async (_l, patch) => {
    const ctx = guest();
    await cartWith(ctx, await mkDish());
    const r = await place(form(patch), ctx);
    expect(r).toMatchObject({ ok: false, fieldErrors: expect.any(Object) });
  });
});

describe("placeOrder delivery time and templates", () => {
  test.each([
    ["a time past closing", { deliveryTime: "22:15" }],
    ["a time inside the next hour", { deliveryTime: "10:30" }],
    ["a time off the 15-minute grid", { deliveryTime: "11:20" }],
    ["yesterday", { deliveryDate: "2026-10-11" }],
    ["a day beyond the window", { deliveryDate: "2026-10-25" }],
  ])("refuses %s as a field error and consumes no Number", async (_l, patch) => {
    const ctx = guest();
    await cartWith(ctx, await mkDish());
    expect(await place(form(patch), ctx)).toMatchObject({
      ok: false,
      fieldErrors: { deliveryTime: [expect.any(String)] },
    });
    expect(await Order.countDocuments()).toBe(0);
    expect(await place(form(), ctx)).toMatchObject({ ok: true, number: 1 });
  });
  test("a User's Order has userId and saves the template; a full list does not fail it", async () => {
    const userId = uid();
    const ctx: OrderContext = {
      ownerKey: userCartKey(userId),
      userId,
      role: "user",
      ip: "1.1.1.1",
    };
    await cartWith(ctx, await mkDish());
    expect(await place(form({ saveTemplate: "on" }), ctx)).toMatchObject({ ok: true });
    expect(String((await Order.findOne().lean())!.userId)).toBe(userId);
    expect(await OrderTemplate.countDocuments({ userId })).toBe(1);
    for (let i = 2; i <= 5; i++) {
      await OrderTemplate.create({
        userId,
        name: "A",
        phone: "+15550000000",
        address: `${i} Other Street`,
      });
    }
    await cartWith(ctx, await mkDish());
    const r = await place(form({ address: "99 New Street", saveTemplate: "on" }), ctx);
    expect(r).toMatchObject({ ok: true });
    expect(await OrderTemplate.countDocuments({ userId })).toBe(5);
  });
  test("the IP limiter blocks the 2nd Order, and invalid input spends no hit", async () => {
    const limiter = fresh(1);
    const ctx = guest();
    await place(form({ name: "" }), ctx, limiter);
    await cartWith(ctx, await mkDish());
    expect(await place(form(), ctx, limiter)).toMatchObject({ ok: true });
    await cartWith(ctx, await mkDish());
    expect(await place(form(), ctx, limiter)).toMatchObject({
      ok: false,
      error: expect.stringContaining("Too many"),
    });
  });
  test("a Guest never creates a template", async () => {
    const ctx = guest();
    await cartWith(ctx, await mkDish());
    await place(form({ saveTemplate: "on" }), ctx);
    expect(await OrderTemplate.countDocuments()).toBe(0);
  });
});
