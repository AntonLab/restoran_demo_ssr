import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import {
  addFavorite,
  favoriteDishIds,
  listFavoriteDishes,
  removeFavorite,
  toggleFavorite,
} from "@/server/favorites";
import { Category } from "@/server/models/category";
import { Dish } from "@/server/models/dish";
import { Favorite } from "@/server/models/favorite";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(async () => {
  await startTestDb();
  await Favorite.init();
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
    favoritesCount: 5,
    ...patch,
  });
  return String(dish._id);
}
const count = async (id: string) => (await Dish.findById(id).lean())!.favoritesCount;

describe("addFavorite / removeFavorite", () => {
  test("adds once, counter goes up by 1 from the Seed base", async () => {
    const dish = await mkDish();
    const user = uid();
    expect(await addFavorite(user, dish)).toEqual({ ok: true, favorited: true, favoritesCount: 6 });
    expect(await addFavorite(user, dish)).toEqual({ ok: true, favorited: true, favoritesCount: 6 });
    expect(await count(dish)).toBe(6);
  });
  test("10 parallel adds of one pair give +1", async () => {
    const dish = await mkDish();
    const user = uid();
    const results = await Promise.all(Array.from({ length: 10 }, () => addFavorite(user, dish)));
    expect(results.every((r) => r.ok)).toBe(true);
    expect(await count(dish)).toBe(6);
    expect(await Favorite.countDocuments()).toBe(1);
  });
  test("removing twice lowers the counter once and never below the base", async () => {
    const dish = await mkDish();
    const user = uid();
    await addFavorite(user, dish);
    expect(await removeFavorite(user, dish)).toEqual({
      ok: true,
      favorited: false,
      favoritesCount: 5,
    });
    expect(await removeFavorite(user, dish)).toEqual({
      ok: true,
      favorited: false,
      favoritesCount: 5,
    });
    expect(await removeFavorite(uid(), dish)).toMatchObject({ favoritesCount: 5 });
  });
  test.each([
    ["inactive Dish", { status: "inactive" }, "active"],
    ["deleted Dish", { deletedAt: new Date() }, "active"],
    ["Dish in an inactive Category", {}, "inactive"],
  ])("rejects %s without touching the counter", async (_n, patch, categoryStatus) => {
    const dish = await mkDish(patch, categoryStatus);
    expect(await addFavorite(uid(), dish)).toEqual({ ok: false, error: "Dish not found." });
    expect(await Favorite.countDocuments()).toBe(0);
    expect(await count(dish)).toBe(5);
  });
  test.each(["abc", "", "123456789012"])("a malformed or unknown id %j is rejected", async (id) => {
    expect(await addFavorite(uid(), id)).toEqual({ ok: false, error: "Dish not found." });
    expect(await addFavorite(uid(), String(new mongoose.Types.ObjectId()))).toMatchObject({
      ok: false,
    });
  });
});

test("toggleFavorite flips the state", async () => {
  const dish = await mkDish();
  const user = uid();
  expect(await toggleFavorite(user, dish)).toMatchObject({ favorited: true, favoritesCount: 6 });
  expect(await toggleFavorite(user, dish)).toMatchObject({ favorited: false, favoritesCount: 5 });
});

test("listFavoriteDishes is newest first and hides invisible Dishes; favoriteDishIds lists all marks", async () => {
  const user = uid();
  const a = await mkDish({ name: "A" });
  const b = await mkDish({ name: "B" });
  const hidden = await mkDish({ name: "H" });
  await addFavorite(user, a);
  await addFavorite(user, hidden);
  await addFavorite(user, b);
  await Dish.updateOne({ _id: hidden }, { deletedAt: new Date() });
  expect((await listFavoriteDishes(user)).map((d) => d.name)).toEqual(["B", "A"]);
  expect((await favoriteDishIds(user)).toSorted()).toEqual([a, b, hidden].toSorted());
  expect(await listFavoriteDishes(uid())).toEqual([]);
});
