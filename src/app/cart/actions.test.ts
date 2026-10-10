import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import {
  addToCartAction,
  removeFromCartAction,
  removeUnavailableAction,
  setQtyAction,
} from "@/app/cart/actions";
import { ensureShopper, getShopper } from "@/server/auth/shopper-cookie";
import { getCart, guestCartKey } from "@/server/cart";
import { Cart } from "@/server/models/cart";
import { Category } from "@/server/models/category";
import { Dish } from "@/server/models/dish";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

vi.mock("@/server/auth/shopper-cookie", () => ({ ensureShopper: vi.fn(), getShopper: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeAll(async () => {
  await startTestDb();
  await Cart.init();
});
afterAll(stopTestDb);
beforeEach(clearTestDb);

async function mkDish(patch: Record<string, unknown> = {}) {
  const category = await Category.create({
    name: `Soups ${new mongoose.Types.ObjectId()}`,
    status: "active",
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

const KEY = guestCartKey("3f2b8c1e-9d4a-4e6b-8a1c-0d5e7f9a2b34");
const guest = { role: "guest", userId: null, ownerKey: KEY } as const;
const as = (shopper: unknown) => {
  vi.mocked(ensureShopper).mockResolvedValue(shopper as never);
  vi.mocked(getShopper).mockResolvedValue(shopper as never);
};
beforeEach(() => vi.mocked(revalidatePath).mockClear());

describe("cart actions", () => {
  test("add, set, remove and clear work for a Guest and revalidate the layout", async () => {
    as(guest);
    const [a, b] = [await mkDish(), await mkDish()];
    expect(await addToCartAction(a)).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    await addToCartAction(b);
    expect(await setQtyAction(a, 3)).toEqual({ ok: true });
    expect((await getCart(KEY)).count).toBe(4);
    expect(await removeFromCartAction(a)).toEqual({ ok: true });
    await Dish.updateOne({ _id: b }, { inStock: false });
    expect(await removeUnavailableAction()).toEqual({ ok: true });
    expect((await getCart(KEY)).lines).toEqual([]);
  });
  test("a domain failure is returned and does not revalidate", async () => {
    as(guest);
    expect(await addToCartAction("not-an-id")).toMatchObject({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  test("an Admin is refused by every action and nothing is written", async () => {
    as(null);
    const d = await mkDish();
    const error = "Admins do not have a cart.";
    expect(await addToCartAction(d)).toEqual({ ok: false, error });
    expect(await setQtyAction(d, 1)).toEqual({ ok: false, error });
    expect(await removeFromCartAction(d)).toEqual({ ok: false, error });
    expect(await removeUnavailableAction()).toEqual({ ok: false, error });
    expect(await Cart.countDocuments()).toBe(0);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  test("a Guest without a cart key cannot set, remove or clear", async () => {
    vi.mocked(getShopper).mockResolvedValue({ role: "guest", userId: null, ownerKey: null });
    const d = await mkDish();
    const error = "Your cart is empty.";
    expect(await setQtyAction(d, 1)).toEqual({ ok: false, error });
    expect(await removeFromCartAction(d)).toEqual({ ok: false, error });
    expect(await removeUnavailableAction()).toEqual({ ok: false, error });
  });
});
