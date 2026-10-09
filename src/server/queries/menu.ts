import mongoose from "mongoose";
import type { MenuFilters, MenuSort } from "@/lib/menu-params";
import { connectDb } from "@/server/db";
import { Category } from "@/server/models/category";
import { Dish } from "@/server/models/dish";

export type DishCardData = {
  id: string;
  name: string;
  shortDescription: string;
  weight: string;
  priceCents: number;
  inStock: boolean;
  favoritesCount: number;
  isChefChoice: boolean;
  imageSmall: string;
  imageMedium: string;
};

export type DishDetail = DishCardData & { fullDescription: string; ingredients: string[] };

export type MenuSection = { key: string; title: string; dishes: DishCardData[] };

type DishRow = {
  _id: unknown;
  name: string;
  shortDescription: string;
  fullDescription: string;
  weight: string;
  ingredients?: string[];
  priceCents: number;
  inStock: boolean;
  favoritesCount: number;
  isChefChoice: boolean;
  image?: { small?: string | null; medium?: string | null } | null;
};

const toCard = (d: DishRow): DishCardData => ({
  id: String(d._id),
  name: d.name,
  shortDescription: d.shortDescription,
  weight: d.weight,
  priceCents: d.priceCents,
  inStock: d.inStock,
  favoritesCount: d.favoritesCount,
  isChefChoice: d.isChefChoice,
  imageSmall: d.image?.small ?? "",
  imageMedium: d.image?.medium ?? "",
});

const SORTS: Record<MenuSort, Record<string, 1 | -1>> = {
  order: { order: 1, _id: 1 },
  "price-asc": { priceCents: 1, order: 1 },
  "price-desc": { priceCents: -1, order: 1 },
  popular: { favoritesCount: -1, order: 1 },
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const activeCategoryIds = async () =>
  (await Category.find({ status: "active" }).select("_id").lean()).map((c) => c._id);

export async function getMenuSections(filters: MenuFilters): Promise<MenuSection[]> {
  await connectDb();
  const categories = await Category.find({ status: "active" }).sort({ order: 1, _id: 1 }).lean();
  const price = {
    ...(filters.minCents !== null && { $gte: filters.minCents }),
    ...(filters.maxCents !== null && { $lte: filters.maxCents }),
  };
  // Sort goes in query options: oxlint's no-array-sort mistakes Query#sort for Array#sort.
  const dishes = await Dish.find(
    {
      status: "active",
      deletedAt: null,
      categoryId: { $in: categories.map((c) => c._id) },
      ...(filters.q && { name: { $regex: escapeRegExp(filters.q), $options: "i" } }),
      ...(Object.keys(price).length > 0 && { priceCents: price }),
      ...(filters.inStock && { inStock: true }),
    },
    null,
    { sort: SORTS[filters.sort] },
  ).lean();

  const sections: MenuSection[] = [
    {
      key: "chefs-choice",
      title: "Chef's choice",
      dishes: dishes.filter((d) => d.isChefChoice).map(toCard),
    },
    ...categories.map((c) => ({
      key: String(c._id),
      title: c.name,
      dishes: dishes.filter((d) => String(d.categoryId) === String(c._id)).map(toCard),
    })),
  ];
  return sections.filter((s) => s.dishes.length > 0);
}

export async function getPopularDishes(limit = 8): Promise<DishCardData[]> {
  await connectDb();
  const dishes = await Dish.find({
    status: "active",
    deletedAt: null,
    inStock: true,
    categoryId: { $in: await activeCategoryIds() },
  })
    .sort({ favoritesCount: -1, order: 1 })
    .limit(limit)
    .lean();
  return dishes.map(toCard);
}

export async function getDishDetail(rawId: string): Promise<DishDetail | null> {
  const id = rawId.toLowerCase();
  // A 12-character string is a valid ObjectId input, so require the round trip to match.
  if (!mongoose.isValidObjectId(id) || String(new mongoose.Types.ObjectId(id)) !== id) return null;
  await connectDb();
  const d = await Dish.findOne({
    _id: id,
    status: "active",
    deletedAt: null,
    categoryId: { $in: await activeCategoryIds() },
  }).lean();
  if (!d) return null;
  return { ...toCard(d), fullDescription: d.fullDescription, ingredients: d.ingredients ?? [] };
}
