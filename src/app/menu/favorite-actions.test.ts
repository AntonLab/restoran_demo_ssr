import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { toggleFavoriteAction } from "@/app/menu/favorite-actions";
import { Category } from "@/server/models/category";
import { Dish } from "@/server/models/dish";
import { Favorite } from "@/server/models/favorite";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";
import { asSession } from "@/server/test/session";

vi.mock("@/server/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeAll(async () => {
  await startTestDb();
  await Favorite.init();
});
afterAll(stopTestDb);
beforeEach(async () => {
  vi.clearAllMocks();
  await clearTestDb();
});

async function mkDish() {
  const category = await Category.create({ name: "Soups", status: "active" });
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

describe("toggleFavoriteAction", () => {
  test.each([null, "admin"] as const)("refuses %s and writes nothing", async (role) => {
    const dish = await mkDish();
    asSession(role, String(new mongoose.Types.ObjectId()));
    expect(await toggleFavoriteAction(dish)).toEqual({
      ok: false,
      error: "Sign in to save favorites.",
    });
    expect(await Favorite.countDocuments()).toBe(0);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  test("a user marks, then unmarks, and the layout is revalidated", async () => {
    const dish = await mkDish();
    asSession("user", String(new mongoose.Types.ObjectId()));
    expect(await toggleFavoriteAction(dish)).toEqual({
      ok: true,
      favorited: true,
      favoritesCount: 1,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(await toggleFavoriteAction(dish)).toEqual({
      ok: true,
      favorited: false,
      favoritesCount: 0,
    });
    expect(await Favorite.countDocuments()).toBe(0);
  });
  test("an unknown dish fails without revalidating", async () => {
    asSession("user", String(new mongoose.Types.ObjectId()));
    expect(await toggleFavoriteAction("not-an-id")).toMatchObject({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
