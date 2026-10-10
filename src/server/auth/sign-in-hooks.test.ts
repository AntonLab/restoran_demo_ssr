import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { afterRegister, afterSignIn } from "@/server/auth/sign-in-hooks";
import { addItem, getCart, guestCartKey, mergeGuestCart, userCartKey } from "@/server/cart";
import { Cart } from "@/server/models/cart";
import { Category } from "@/server/models/category";
import { Dish } from "@/server/models/dish";
import { Order } from "@/server/models/order";
import { attachGuestOrders } from "@/server/orders";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

const store = { get: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => store }));
vi.mock("@/server/cart", async (orig) => {
  const real = await orig<typeof import("@/server/cart")>();
  return { ...real, mergeGuestCart: vi.fn(real.mergeGuestCart) };
});
vi.mock("@/server/orders", async (orig) => {
  const real = await orig<typeof import("@/server/orders")>();
  return { ...real, attachGuestOrders: vi.fn(real.attachGuestOrders) };
});

beforeAll(async () => {
  await startTestDb();
  await Cart.init();
  await Order.init();
});
afterAll(stopTestDb);
let seq = 0;
beforeEach(async () => {
  seq = 0;
  vi.clearAllMocks();
  await clearTestDb();
});

const CID = "3f2b8c1e-9d4a-4e6b-8a1c-0d5e7f9a2b34";
const hasCookie = (value: string | undefined) =>
  store.get.mockReturnValue(value === undefined ? undefined : { value });

const oid = () => new mongoose.Types.ObjectId();
const uid = () => String(oid());
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

describe("afterSignIn", () => {
  test("merges the Guest Cart into the User's and clears the cookie", async () => {
    const u = uid();
    const d = await mkDish();
    await addItem(guestCartKey(CID), d);
    hasCookie(CID);
    await afterSignIn(u, "user");
    expect((await getCart(userCartKey(u))).lines).toMatchObject([{ dishId: d, qty: 1 }]);
    expect(await Cart.findOne({ ownerKey: guestCartKey(CID) })).toBeNull();
    expect(store.delete).toHaveBeenCalledWith("cid");
  });
  test("no cookie: nothing is created or deleted", async () => {
    hasCookie(undefined);
    await afterSignIn(uid(), "user");
    expect(await Cart.countDocuments()).toBe(0);
    expect(store.delete).not.toHaveBeenCalled();
  });
  test("a forged cookie is not merged but is cleared", async () => {
    hasCookie("guest:evil");
    await afterSignIn(uid(), "user");
    expect(mergeGuestCart).not.toHaveBeenCalled();
    expect(store.delete).toHaveBeenCalledWith("cid");
  });
  test("an Admin keeps the Guest Cart and the cookie", async () => {
    hasCookie(CID);
    await afterSignIn(uid(), "admin");
    expect(mergeGuestCart).not.toHaveBeenCalled();
    expect(store.delete).not.toHaveBeenCalled();
  });
  test("a failing merge is logged and does not throw", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mergeGuestCart).mockRejectedValueOnce(new Error("boom"));
    hasCookie(CID);
    await expect(afterSignIn(uid(), "user")).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
    expect(store.delete).toHaveBeenCalledWith("cid");
    log.mockRestore();
  });
});

describe("afterRegister", () => {
  test("attaches Guest Orders by phone and merges the Cart", async () => {
    const u = uid();
    await mkOrder(null);
    await addItem(guestCartKey(CID), await mkDish());
    hasCookie(CID);
    await afterRegister(u, "+15551234567");
    expect(String((await Order.findOne().lean())!.userId)).toBe(u);
    expect((await getCart(userCartKey(u))).count).toBe(1);
  });
  test("a failing attach is logged and the Cart still merges", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(attachGuestOrders).mockRejectedValueOnce(new Error("boom"));
    const u = uid();
    await addItem(guestCartKey(CID), await mkDish());
    hasCookie(CID);
    await expect(afterRegister(u, "+15551234567")).resolves.toBeUndefined();
    expect((await getCart(userCartKey(u))).count).toBe(1);
    log.mockRestore();
  });
});
