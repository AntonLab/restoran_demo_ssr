import { connectDb } from "@/server/db";
import { Dish } from "@/server/models/dish";
import { Favorite } from "@/server/models/favorite";
import { activeCategoryIds, parseObjectId, toCard, type DishCardData } from "@/server/queries/menu";

export type FavoriteResult =
  | { ok: true; favorited: boolean; favoritesCount: number }
  | { ok: false; error: string };

const NOT_FOUND: FavoriteResult = { ok: false, error: "Dish not found." };

// Same visibility rule as the Menu.
async function visibleFilter() {
  return {
    status: "active" as const,
    deletedAt: null,
    categoryId: { $in: await activeCategoryIds() },
  };
}

async function visibleDish(rawId: string): Promise<string | null> {
  const id = parseObjectId(rawId);
  if (!id) return null;
  await connectDb();
  const dish = await Dish.exists({ _id: id, ...(await visibleFilter()) });
  return dish ? id : null;
}

const currentCount = async (dishId: string) =>
  (await Dish.findById(dishId).select("favoritesCount").lean())?.favoritesCount ?? 0;

export async function addFavorite(userId: string, rawDishId: string): Promise<FavoriteResult> {
  const dishId = await visibleDish(rawDishId);
  if (!dishId) return NOT_FOUND;
  try {
    await Favorite.create({ userId, dishId });
    await Dish.updateOne({ _id: dishId }, { $inc: { favoritesCount: 1 } });
  } catch (err) {
    // Duplicate key: the pair is already marked, so the counter was already bumped.
    if ((err as { code?: number }).code !== 11000) throw err;
  }
  return { ok: true, favorited: true, favoritesCount: await currentCount(dishId) };
}

export async function removeFavorite(userId: string, rawDishId: string): Promise<FavoriteResult> {
  const dishId = await visibleDish(rawDishId);
  if (!dishId) return NOT_FOUND;
  const { deletedCount } = await Favorite.deleteOne({ userId, dishId });
  if (deletedCount === 1) await Dish.updateOne({ _id: dishId }, { $inc: { favoritesCount: -1 } });
  return { ok: true, favorited: false, favoritesCount: await currentCount(dishId) };
}

export async function toggleFavorite(userId: string, rawDishId: string): Promise<FavoriteResult> {
  const dishId = await visibleDish(rawDishId);
  if (!dishId) return NOT_FOUND;
  return (await Favorite.exists({ userId, dishId }))
    ? removeFavorite(userId, dishId)
    : addFavorite(userId, dishId);
}

export async function listFavoriteDishes(userId: string): Promise<DishCardData[]> {
  await connectDb();
  const marks = await Favorite.find({ userId }, null, { sort: { createdAt: -1, _id: -1 } }).lean();
  const dishes = await Dish.find({
    _id: { $in: marks.map((m) => m.dishId) },
    ...(await visibleFilter()),
  }).lean();
  const byId = new Map(dishes.map((d) => [String(d._id), d]));
  return marks.flatMap((m) => {
    const d = byId.get(String(m.dishId));
    return d ? [toCard(d)] : [];
  });
}

export async function favoriteDishIds(userId: string): Promise<string[]> {
  await connectDb();
  const marks = await Favorite.find({ userId }).select("dishId").lean();
  return marks.map((m) => String(m.dishId));
}
