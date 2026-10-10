import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import {
  addItem,
  cartCount,
  cartQuantities,
  getCart,
  guestCartKey,
  mergeGuestCart,
  removeItem,
  removeUnavailable,
  setQty,
  userCartKey,
} from "@/server/cart";
import { Cart } from "@/server/models/cart";
import { Category } from "@/server/models/category";
import { Dish } from "@/server/models/dish";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(async () => {
  await startTestDb();
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

const GUEST = guestCartKey("abc");
const USER = () => userCartKey(uid());

describe("addItem", () => {
  test("adds a line, then increments it", async () => {
    const d = await mkDish();
    expect(await addItem(GUEST, d)).toEqual({ ok: true });
    await addItem(GUEST, d);
    const cart = await getCart(GUEST);
    expect(cart.lines).toMatchObject([
      { dishId: d, qty: 2, priceCents: 850, lineTotalCents: 1700 },
    ]);
    expect(cart.totalCents).toBe(1700);
    expect((await Cart.findOne({ ownerKey: GUEST }))!.guest).toBe(true);
  });
  test("a user cart is not a guest cart", async () => {
    const key = USER();
    await addItem(key, await mkDish());
    expect((await Cart.findOne({ ownerKey: key }))!.guest).toBe(false);
  });
  test("refuses a 21st unit", async () => {
    const d = await mkDish();
    for (let i = 0; i < 20; i++) await addItem(GUEST, d);
    expect(await addItem(GUEST, d)).toMatchObject({ ok: false });
    expect((await getCart(GUEST)).lines[0].qty).toBe(20);
  });
  test("refuses a 31st line", async () => {
    for (let i = 0; i < 30; i++) await addItem(GUEST, await mkDish());
    expect(await addItem(GUEST, await mkDish())).toMatchObject({ ok: false });
    expect((await getCart(GUEST)).lines).toHaveLength(30);
  });
  test.each([
    ["an invalid id", async () => "not-an-id"],
    ["an unknown id", async () => uid()],
    ["a soft-deleted dish", () => mkDish({ deletedAt: new Date() })],
    ["an inactive dish", () => mkDish({ status: "inactive" })],
    ["an out-of-stock dish", () => mkDish({ inStock: false })],
    ["a dish in an inactive category", () => mkDish({}, "inactive")],
  ])("refuses %s without throwing", async (_label, make) => {
    expect(await addItem(GUEST, await make())).toMatchObject({ ok: false });
    expect((await getCart(GUEST)).lines).toEqual([]);
  });
});

describe("setQty", () => {
  test("sets, and 0 removes the line", async () => {
    const d = await mkDish();
    await addItem(GUEST, d);
    expect(await setQty(GUEST, d, 5)).toEqual({ ok: true });
    expect((await getCart(GUEST)).lines[0].qty).toBe(5);
    expect(await setQty(GUEST, d, 0)).toEqual({ ok: true });
    expect((await getCart(GUEST)).lines).toEqual([]);
  });
  test.each([21, 1.5, -1, Number.NaN, "3", null])(
    "rejects qty %j and leaves the cart",
    async (qty) => {
      const d = await mkDish();
      await addItem(GUEST, d);
      expect(await setQty(GUEST, d, qty)).toMatchObject({ ok: false });
      expect((await getCart(GUEST)).lines[0].qty).toBe(1);
    },
  );
  test("errors for a dish that is not in the cart or has a bad id", async () => {
    expect(await setQty(GUEST, await mkDish(), 2)).toMatchObject({ ok: false });
    expect(await setQty(GUEST, "zzz", 2)).toMatchObject({ ok: false });
  });
});

describe("getCart", () => {
  test("prices are live", async () => {
    const d = await mkDish();
    await addItem(GUEST, d);
    await Dish.updateOne({ _id: d }, { priceCents: 900 });
    expect((await getCart(GUEST)).totalCents).toBe(900);
  });
  test("marks unavailable lines and leaves them out of the total", async () => {
    const [ok, off, out, hidden] = [
      await mkDish(),
      await mkDish(),
      await mkDish(),
      await mkDish({}, "active"),
    ];
    for (const d of [ok, off, out, hidden]) await addItem(GUEST, d);
    await Dish.updateOne({ _id: off }, { status: "inactive" });
    await Dish.updateOne({ _id: out }, { inStock: false });
    await Category.updateOne(
      { _id: (await Dish.findById(hidden))!.categoryId },
      { status: "inactive" },
    );
    const cart = await getCart(GUEST);
    expect(cart.lines.filter((l) => l.unavailable)).toHaveLength(3);
    expect(cart).toMatchObject({ totalCents: 850, hasUnavailable: true, count: 4 });
  });
  test("a soft-deleted dish disappears and stays gone", async () => {
    const d = await mkDish();
    await addItem(GUEST, d);
    await Dish.updateOne({ _id: d }, { deletedAt: new Date() });
    expect((await getCart(GUEST)).lines).toEqual([]);
    expect((await Cart.findOne({ ownerKey: GUEST }))!.items).toHaveLength(0);
  });
  test("a missing cart is empty", async () => {
    expect((await getCart(GUEST)).lines).toEqual([]);
    expect(await cartCount(GUEST)).toBe(0);
  });
});

test("removeItem, removeUnavailable and cartCount", async () => {
  const [a, b] = [await mkDish(), await mkDish()];
  await addItem(GUEST, a);
  await addItem(GUEST, a);
  await addItem(GUEST, b);
  expect(await cartCount(GUEST)).toBe(3);
  await Dish.updateOne({ _id: b }, { inStock: false });
  expect(await removeUnavailable(GUEST)).toEqual({ ok: true });
  expect((await getCart(GUEST)).lines.map((l) => l.dishId)).toEqual([a]);
  expect(await removeItem(GUEST, a)).toEqual({ ok: true });
  expect((await getCart(GUEST)).lines).toEqual([]);
});

describe("mergeGuestCart", () => {
  test("adds quantities with a cap of 20, keeps user-only lines, deletes the guest cart", async () => {
    const [shared, guestOnly, userOnly] = [await mkDish(), await mkDish(), await mkDish()];
    const userId = uid();
    const user = userCartKey(userId);
    await Cart.create({
      ownerKey: guestCartKey("abc"),
      guest: true,
      items: [
        { dishId: shared, qty: 15 },
        { dishId: guestOnly, qty: 2 },
      ],
    });
    await Cart.create({
      ownerKey: user,
      guest: false,
      items: [
        { dishId: shared, qty: 10 },
        { dishId: userOnly, qty: 1 },
      ],
    });
    await mergeGuestCart("abc", userId);
    const items = (await Cart.findOne({ ownerKey: user }))!.items.map((i) => [
      String(i.dishId),
      i.qty,
    ]);
    expect(Object.fromEntries(items)).toEqual({ [shared]: 20, [guestOnly]: 2, [userOnly]: 1 });
    expect(await Cart.findOne({ ownerKey: guestCartKey("abc") })).toBeNull();
  });
  test("drops guest lines beyond 30", async () => {
    const userId = uid();
    const userItems = Array.from({ length: 29 }, () => ({
      dishId: new mongoose.Types.ObjectId(),
      qty: 1,
    }));
    await Cart.create({ ownerKey: userCartKey(userId), guest: false, items: userItems });
    const extra = Array.from({ length: 3 }, () => ({
      dishId: new mongoose.Types.ObjectId(),
      qty: 1,
    }));
    await Cart.create({ ownerKey: guestCartKey("abc"), guest: true, items: extra });
    await mergeGuestCart("abc", userId);
    const merged = (await Cart.findOne({ ownerKey: userCartKey(userId) }))!.items;
    expect(merged).toHaveLength(30);
    expect(String(merged[29].dishId)).toBe(String(extra[0].dishId));
  });
  test("creates the user cart when none exists and ignores a missing guest cart", async () => {
    const userId = uid();
    await mergeGuestCart("nobody", userId);
    expect(await Cart.findOne({ ownerKey: userCartKey(userId) })).toBeNull();
    await Cart.create({
      ownerKey: guestCartKey("abc"),
      guest: true,
      items: [{ dishId: new mongoose.Types.ObjectId(), qty: 3 }],
    });
    await mergeGuestCart("abc", userId);
    expect(await Cart.findOne({ ownerKey: userCartKey(userId) })).toMatchObject({ guest: false });
  });
});

describe("cartQuantities", () => {
  test("maps Dish id to qty, unavailable lines included", async () => {
    const [a, b] = [await mkDish(), await mkDish()];
    await addItem(GUEST, a);
    await addItem(GUEST, a);
    await addItem(GUEST, b);
    await Dish.updateOne({ _id: b }, { inStock: false });
    expect(await cartQuantities(GUEST)).toEqual({ [a]: 2, [b]: 1 });
  });
  test("a missing Cart is an empty map", async () => {
    expect(await cartQuantities(GUEST)).toEqual({});
  });
});
