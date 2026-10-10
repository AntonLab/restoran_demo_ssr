import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { checkoutAction } from "@/app/checkout/actions";
import { WEEKDAYS } from "@/lib/weekdays";
import { getShopper } from "@/server/auth/shopper-cookie";
import { addItem, guestCartKey, userCartKey } from "@/server/cart";
import { Cart } from "@/server/models/cart";
import { Category } from "@/server/models/category";
import { Dish } from "@/server/models/dish";
import { Order } from "@/server/models/order";
import { OrderTemplate } from "@/server/models/order-template";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

vi.mock("@/server/queries/settings", () => ({
  getSettings: async () => ({
    timezone: "UTC",
    schedule: WEEKDAYS.map((day) => ({ day, open: "09:00", close: "22:00", closed: false })),
  }),
}));
vi.mock("@/server/auth/shopper-cookie", () => ({ getShopper: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

beforeAll(async () => {
  await startTestDb();
  await Order.init();
  await Cart.init();
  await OrderTemplate.init();
});
afterAll(stopTestDb);
beforeEach(async () => {
  await clearTestDb();
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-12T10:07:00Z") });
});
afterEach(() => vi.useRealTimers());

async function mkDish() {
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
  });
  return String(dish._id);
}

const guest = { role: "guest", userId: null, ownerKey: guestCartKey("abc") } as const;
const BASE = {
  name: "Ann",
  phone: "+1 555 123 4567",
  address: "12 Main Street",
  deliveryDate: "2026-10-12",
  deliveryTime: "11:15",
  expectedTotalCents: "850",
};
const fd = (patch: Record<string, string> = {}) => {
  const form = new FormData();
  for (const [k, v] of Object.entries({ ...BASE, ...patch })) form.append(k, v);
  return form;
};

describe("checkoutAction", () => {
  test("a Guest order redirects to the confirmation and revalidates", async () => {
    vi.mocked(getShopper).mockResolvedValue(guest);
    await addItem(guest.ownerKey, await mkDish());
    await expect(checkoutAction({ status: "idle" }, fd())).rejects.toThrow(
      "NEXT_REDIRECT:/checkout/done?number=1",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(await Order.countDocuments()).toBe(1);
  });
  test("invalid fields come back as a form state, with no redirect", async () => {
    vi.mocked(getShopper).mockResolvedValue(guest);
    await addItem(guest.ownerKey, await mkDish());
    const state = await checkoutAction({ status: "idle" }, fd({ name: "   " }));
    expect(state).toMatchObject({ status: "error", fieldErrors: { name: [expect.any(String)] } });
  });
  test("a changed price is reported and nothing is ordered", async () => {
    vi.mocked(getShopper).mockResolvedValue(guest);
    await addItem(guest.ownerKey, await mkDish());
    const state = await checkoutAction({ status: "idle" }, fd({ expectedTotalCents: "800" }));
    expect(state).toEqual({ status: "error", error: "Prices changed, review your cart" });
    expect(await Order.countDocuments()).toBe(0);
  });
  test("an Admin (no shopper) is refused", async () => {
    vi.mocked(getShopper).mockResolvedValue(null);
    expect(await checkoutAction({ status: "idle" }, fd())).toMatchObject({
      status: "error",
      error: "Admins cannot place orders.",
    });
  });
  test("a User saves a template only when the box is ticked", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const user = { role: "user", userId, ownerKey: userCartKey(userId) } as const;
    vi.mocked(getShopper).mockResolvedValue(user);
    await addItem(user.ownerKey, await mkDish());
    await expect(checkoutAction({ status: "idle" }, fd())).rejects.toThrow("NEXT_REDIRECT");
    expect(await OrderTemplate.countDocuments({ userId })).toBe(0);
    await addItem(user.ownerKey, await mkDish());
    await expect(checkoutAction({ status: "idle" }, fd({ saveTemplate: "on" }))).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(await OrderTemplate.countDocuments({ userId })).toBe(1);
  });
});
