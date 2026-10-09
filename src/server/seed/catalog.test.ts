import { expect, test } from "vitest";
import { CATEGORY_NAMES, SEED_DISHES, SEED_REVIEWS } from "@/server/seed/catalog";

test("12 Categories, none called Chef's choice", () => {
  expect(CATEGORY_NAMES).toHaveLength(12);
  expect(CATEGORY_NAMES).not.toContain("Chef's choice");
});
test("dishes are well-formed", () => {
  expect(SEED_DISHES.length).toBeGreaterThanOrEqual(36);
  expect(new Set(SEED_DISHES.map((d) => d.name)).size).toBe(SEED_DISHES.length);
  expect(new Set(SEED_DISHES.map((d) => d.image)).size).toBe(SEED_DISHES.length);
  for (const d of SEED_DISHES) {
    expect(CATEGORY_NAMES).toContain(d.category);
    expect(Number.isInteger(d.priceCents) && d.priceCents > 0).toBe(true);
    expect(d.image).toMatch(/^[a-z0-9-]+\.jpg$/);
    expect(d.weight).toMatch(/\d.*\sg$|\sml$/);
  }
  for (const c of CATEGORY_NAMES) expect(SEED_DISHES.some((d) => d.category === c)).toBe(true);
});
test("covers the Menu features the UI must show", () => {
  expect(SEED_DISHES.filter((d) => d.isChefChoice).length).toBeGreaterThanOrEqual(4);
  expect(SEED_DISHES.filter((d) => d.inStock === false).length).toBeGreaterThanOrEqual(2);
  expect(SEED_DISHES.filter((d) => d.favoritesCount > 0).length).toBeGreaterThanOrEqual(10);
  expect(SEED_DISHES.some((d) => d.weight.includes("/"))).toBe(true);
});
test("about 12 reviews with varied ratings", () => {
  expect(SEED_REVIEWS).toHaveLength(12);
  expect(new Set(SEED_REVIEWS.map((r) => r.dishesRating)).size).toBeGreaterThan(1);
  for (const r of SEED_REVIEWS) expect(r.text.length).toBeGreaterThan(10);
});
