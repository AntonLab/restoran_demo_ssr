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
  test("adds once, the count is the number of marks", async () => {
    const dish = await mkDish();
    const user = uid();
    expect(await addFavorite(user, dish)).toEqual({ ok: true, favorited: true, favoritesCount: 1 });
    expect(await addFavorite(user, dish)).toEqual({ ok: true, favorited: true, favoritesCount: 1 });
    expect(await addFavorite(uid(), dish)).toMatchObject({ favoritesCount: 2 });
    expect(await count(dish)).toBe(2);
  });
  test("10 parallel adds of one pair give 1", async () => {
    const dish = await mkDish();
    const user = uid();
    const results = await Promise.all(Array.from({ length: 10 }, () => addFavorite(user, dish)));
    expect(results.every((r) => r.ok)).toBe(true);
    expect(await count(dish)).toBe(1);
    expect(await Favorite.countDocuments()).toBe(1);
  });
  test("removing twice lowers the count once", async () => {
    const dish = await mkDish();
    const [user, other] = [uid(), uid()];
    await addFavorite(user, dish);
    await addFavorite(other, dish);
    expect(await removeFavorite(user, dish)).toEqual({
      ok: true,
      favorited: false,
      favoritesCount: 1,
    });
    expect(await removeFavorite(user, dish)).toEqual({
      ok: true,
      favorited: false,
      favoritesCount: 1,
    });
    expect(await removeFavorite(uid(), dish)).toMatchObject({ favoritesCount: 1 });
  });
  test("a seeded base survives toggles: add gives N+1, remove gives N", async () => {
    const dish = await mkDish({ favoritesBase: 41, favoritesCount: 41 });
    const user = uid();
    expect(await addFavorite(user, dish)).toMatchObject({ favoritesCount: 42 });
    expect(await removeFavorite(user, dish)).toMatchObject({ favoritesCount: 41 });
    expect(await count(dish)).toBe(41);
  });
  test("a Dish from an older Seed without favoritesBase keeps its count as the base", async () => {
    const dish = await mkDish({ favoritesCount: 33 });
    await Dish.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(dish) },
      { $unset: { favoritesBase: "" } },
    );
    const user = uid();
    expect(await addFavorite(user, dish)).toMatchObject({ favoritesCount: 34 });
    expect((await Dish.findById(dish).lean())!.favoritesBase).toBe(33);
    expect(await removeFavorite(user, dish)).toMatchObject({ favoritesCount: 33 });
  });
  test("a stale count heals to base + marks", async () => {
    const dish = await mkDish({ favoritesBase: 10, favoritesCount: 99 });
    expect(await addFavorite(uid(), dish)).toMatchObject({ favoritesCount: 11 });
    expect(await count(dish)).toBe(11);
  });
  test("a stale count heals on the next add", async () => {
    const dish = await mkDish({ favoritesCount: 40 });
    expect(await addFavorite(uid(), dish)).toMatchObject({ favoritesCount: 1 });
    expect(await count(dish)).toBe(1);
  });
  test("a stale count heals on the next remove", async () => {
    const dish = await mkDish({ favoritesCount: 0 });
    const [a, b] = [uid(), uid()];
    await Favorite.create([
      { userId: a, dishId: dish },
      { userId: b, dishId: dish },
    ]);
    expect(await removeFavorite(a, dish)).toMatchObject({ favoritesCount: 1 });
    expect(await count(dish)).toBe(1);
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
  expect(await toggleFavorite(user, dish)).toMatchObject({ favorited: true, favoritesCount: 1 });
  expect(await toggleFavorite(user, dish)).toMatchObject({ favorited: false, favoritesCount: 0 });
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
