import { connectDb } from "@/server/db";
import { Cart } from "@/server/models/cart";
import { Category } from "@/server/models/category";
import { Dish } from "@/server/models/dish";
import { activeCategoryIds, parseObjectId } from "@/server/queries/menu";

export const MAX_QTY = 20;
export const MAX_LINES = 30;

export const userCartKey = (userId: string) => `user:${userId}`;
export const guestCartKey = (cid: string) => `guest:${cid}`;

export type CartLine = {
  dishId: string;
  name: string;
  priceCents: number;
  qty: number;
  imageSmall: string;
  unavailable: boolean;
  lineTotalCents: number;
};
export type CartView = {
  lines: CartLine[];
  totalCents: number;
  count: number;
  hasUnavailable: boolean;
};
export type CartResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): CartResult => ({ ok: false, error });
const NOT_FOUND = fail("Dish not found.");

async function isVisibleDish(id: string) {
  return Boolean(
    await Dish.exists({
      _id: id,
      status: "active",
      deletedAt: null,
      inStock: true,
      categoryId: { $in: await activeCategoryIds() },
    }),
  );
}

// Load-modify-save keeps the schema validators (qty, line cap) in force. Two first adds can race
// on the unique ownerKey; the loser retries once and finds the winner's Cart.
async function editCart(
  ownerKey: string,
  edit: (items: { dishId: unknown; qty: number }[]) => CartResult,
  attempt = 0,
): Promise<CartResult> {
  const cart =
    (await Cart.findOne({ ownerKey })) ??
    new Cart({ ownerKey, guest: ownerKey.startsWith("guest:"), items: [] });
  const result = edit(cart.items);
  if (!result.ok) return result;
  try {
    await cart.save();
  } catch (err) {
    if ((err as { code?: number }).code === 11000 && attempt === 0) {
      return editCart(ownerKey, edit, 1);
    }
    throw err;
  }
  return result;
}

const sameDish = (a: unknown, id: string) => String(a) === id;

export async function addItem(ownerKey: string, rawDishId: string): Promise<CartResult> {
  await connectDb();
  const dishId = parseObjectId(rawDishId);
  if (!dishId) return NOT_FOUND;
  const exists = await Dish.exists({ _id: dishId, deletedAt: null });
  if (!exists) return NOT_FOUND;
  if (!(await isVisibleDish(dishId))) return fail("Dish is unavailable.");
  return editCart(ownerKey, (items) => {
    const line = items.find((i) => sameDish(i.dishId, dishId));
    if (line) {
      if (line.qty >= MAX_QTY) return fail("You can order at most 20 of one dish.");
      line.qty += 1;
    } else {
      if (items.length >= MAX_LINES) return fail("Your cart can hold at most 30 dishes.");
      items.push({ dishId, qty: 1 });
    }
    return { ok: true };
  });
}

export async function setQty(
  ownerKey: string,
  rawDishId: string,
  rawQty: unknown,
): Promise<CartResult> {
  await connectDb();
  const dishId = parseObjectId(rawDishId);
  if (!dishId) return NOT_FOUND;
  if (typeof rawQty !== "number" || !Number.isInteger(rawQty) || rawQty < 0 || rawQty > MAX_QTY) {
    return fail("Choose a quantity from 1 to 20.");
  }
  return editCart(ownerKey, (items) => {
    const idx = items.findIndex((i) => sameDish(i.dishId, dishId));
    if (idx < 0) return fail("That dish is not in your cart.");
    if (rawQty === 0) items.splice(idx, 1);
    else items[idx].qty = rawQty;
    return { ok: true };
  });
}

export async function removeItem(ownerKey: string, rawDishId: string): Promise<CartResult> {
  await connectDb();
  const dishId = parseObjectId(rawDishId);
  if (!dishId) return NOT_FOUND;
  await Cart.updateOne({ ownerKey }, { $pull: { items: { dishId } } });
  return { ok: true };
}

export async function cartCount(ownerKey: string): Promise<number> {
  await connectDb();
  const cart = await Cart.findOne({ ownerKey }).select("items").lean();
  return (cart?.items ?? []).reduce((sum, i) => sum + i.qty, 0);
}

export async function getCart(ownerKey: string): Promise<CartView> {
  await connectDb();
  const cart = await Cart.findOne({ ownerKey }).lean();
  const items = cart?.items ?? [];
  const dishes = await Dish.find({ _id: { $in: items.map((i) => i.dishId) } }).lean();
  const byId = new Map(dishes.map((d) => [String(d._id), d]));
  const inactive = new Set(
    (
      await Category.find({
        _id: { $in: dishes.map((d) => d.categoryId) },
        status: { $ne: "active" },
      })
        .select("_id")
        .lean()
    ).map((c) => String(c._id)),
  );

  const gone = items.filter(
    (i) => !byId.get(String(i.dishId)) || byId.get(String(i.dishId))!.deletedAt,
  );
  if (gone.length > 0) {
    await Cart.updateOne(
      { ownerKey },
      { $pull: { items: { dishId: { $in: gone.map((i) => i.dishId) } } } },
    );
  }

  const lines = items.flatMap((i): CartLine[] => {
    const d = byId.get(String(i.dishId));
    if (!d || d.deletedAt) return [];
    const unavailable = d.status !== "active" || !d.inStock || inactive.has(String(d.categoryId));
    return [
      {
        dishId: String(d._id),
        name: d.name,
        priceCents: d.priceCents,
        qty: i.qty,
        imageSmall: d.image?.small ?? "",
        unavailable,
        lineTotalCents: unavailable ? 0 : d.priceCents * i.qty,
      },
    ];
  });
  return {
    lines,
    totalCents: lines.reduce((sum, l) => sum + l.lineTotalCents, 0),
    count: lines.reduce((sum, l) => sum + l.qty, 0),
    hasUnavailable: lines.some((l) => l.unavailable),
  };
}

export async function removeUnavailable(ownerKey: string): Promise<CartResult> {
  const { lines } = await getCart(ownerKey);
  const dishIds = lines.filter((l) => l.unavailable).map((l) => l.dishId);
  if (dishIds.length > 0) {
    await Cart.updateOne({ ownerKey }, { $pull: { items: { dishId: { $in: dishIds } } } });
  }
  return { ok: true };
}
