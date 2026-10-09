import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import mongoose from "mongoose";
import { DEFAULT_MENU_FILTERS, type MenuFilters } from "@/lib/menu-params";
import { Category } from "@/server/models/category";
import { Dish } from "@/server/models/dish";
import { getDishDetail, getMenuSections, getPopularDishes } from "@/server/queries/menu";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

const f = (over: Partial<MenuFilters> = {}): MenuFilters => ({ ...DEFAULT_MENU_FILTERS, ...over });
const mk = (name: string, categoryId: mongoose.Types.ObjectId, priceCents: number, over = {}) => ({
  name,
  categoryId,
  priceCents,
  shortDescription: "s",
  fullDescription: "f",
  weight: "300 g",
  image: { small: "s.webp", medium: "m.webp" },
  ...over,
});

async function seed() {
  const [soups, desserts, hidden] = await Category.create([
    { name: "Soups", order: 1 },
    { name: "Desserts", order: 2 },
    { name: "Hidden", order: 3, status: "inactive" },
  ]);
  const s = soups._id;
  const dishes = await Dish.create([
    mk("Borscht", s, 900, { order: 1, favoritesCount: 5, isChefChoice: true }),
    mk("Gazpacho", s, 700, { order: 2, favoritesCount: 9 }),
    mk("Cake (3-layer)", desserts._id, 600, { inStock: false }),
    mk("Inactive dish", s, 100, { status: "inactive" }),
    mk("Deleted dish", s, 100, { deletedAt: new Date() }),
    mk("Secret", hidden._id, 100),
  ]);
  return { soups, desserts, dishes };
}

const names = (s: { dishes: { name: string }[] }) => s.dishes.map((d) => d.name);

describe("getMenuSections", () => {
  test("Chef's choice first, then active Categories; hidden items excluded", async () => {
    await seed();
    const sections = await getMenuSections(f());
    expect(sections.map((s) => s.title)).toEqual(["Chef's choice", "Soups", "Desserts"]);
    expect(sections[0].key).toBe("chefs-choice");
    expect(names(sections[0])).toEqual(["Borscht"]);
    expect(names(sections[1])).toEqual(["Borscht", "Gazpacho"]);
  });
  test("empty database gives no sections", async () => {
    expect(await getMenuSections(f())).toEqual([]);
  });
  test("name filter is case-insensitive and hides emptied sections", async () => {
    await seed();
    const sections = await getMenuSections(f({ q: "GAZ" }));
    expect(sections.map((s) => s.title)).toEqual(["Soups"]);
    expect(names(sections[0])).toEqual(["Gazpacho"]);
  });
  test.each(["[a-", "\\", ".*", "a.c"])(
    "regex characters in q=%j are literal and do not throw",
    async (q) => {
      await seed();
      await expect(getMenuSections(f({ q }))).resolves.toEqual([]);
    },
  );
  test("literal parentheses still match", async () => {
    await seed();
    expect((await getMenuSections(f({ q: "(3-layer)" }))).map((s) => s.title)).toEqual([
      "Desserts",
    ]);
  });
  test("price range is inclusive; inStock hides out-of-stock dishes", async () => {
    await seed();
    const range = await getMenuSections(f({ minCents: 700, maxCents: 900 }));
    expect(names(range[1])).toEqual(["Borscht", "Gazpacho"]);
    expect(range.map((s) => s.title)).not.toContain("Desserts");
    const stock = await getMenuSections(f({ inStock: true }));
    expect(stock.map((s) => s.title)).not.toContain("Desserts");
  });
  test("sorts apply inside every section", async () => {
    await seed();
    const asc = await getMenuSections(f({ sort: "price-asc" }));
    expect(names(asc[1])).toEqual(["Gazpacho", "Borscht"]);
    const desc = await getMenuSections(f({ sort: "price-desc" }));
    expect(names(desc[1])).toEqual(["Borscht", "Gazpacho"]);
    const popular = await getMenuSections(f({ sort: "popular" }));
    expect(names(popular[1])).toEqual(["Gazpacho", "Borscht"]);
  });
});

describe("getPopularDishes", () => {
  test("top by favoritesCount then order; excludes out of stock and hidden", async () => {
    await seed();
    expect((await getPopularDishes()).map((d) => d.name)).toEqual(["Gazpacho", "Borscht"]);
  });
  test("respects the limit (default 8)", async () => {
    const { soups } = await seed();
    await Dish.create(Array.from({ length: 10 }, (_, i) => mk(`Extra ${i}`, soups._id, 100)));
    expect(await getPopularDishes()).toHaveLength(8);
    expect(await getPopularDishes(3)).toHaveLength(3);
  });
});

describe("getDishDetail", () => {
  test("returns the dish with full description and ingredients", async () => {
    const { dishes } = await seed();
    const d = await getDishDetail(String(dishes[0]._id));
    expect(d).toMatchObject({ name: "Borscht", fullDescription: "f", weight: "300 g" });
    expect(d?.ingredients).toEqual([]);
  });
  test("uppercase 24-hex id resolves", async () => {
    const { dishes } = await seed();
    const d = await getDishDetail(String(dishes[0]._id).toUpperCase());
    expect(d?.name).toBe("Borscht");
  });
  test.each(["abc", "", "123", "zzzzzzzzzzzzzzzzzzzzzzzz", "abcdefghijkl"])(
    "malformed id %j gives null",
    async (id) => {
      await expect(getDishDetail(id)).resolves.toBeNull();
    },
  );
  test("unknown, inactive, deleted and hidden-category dishes give null", async () => {
    const { dishes } = await seed();
    expect(await getDishDetail(String(new mongoose.Types.ObjectId()))).toBeNull();
    for (const i of [3, 4, 5]) expect(await getDishDetail(String(dishes[i]._id))).toBeNull();
  });
});
