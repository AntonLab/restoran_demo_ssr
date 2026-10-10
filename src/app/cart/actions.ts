"use server";

import { revalidatePath } from "next/cache";
import { ensureShopper, getShopper } from "@/server/auth/shopper-cookie";
import { addItem, type CartResult, removeItem, removeUnavailable, setQty } from "@/server/cart";

const NO_CART: CartResult = { ok: false, error: "Admins do not have a cart." };
const EMPTY: CartResult = { ok: false, error: "Your cart is empty." };

async function run(
  shopper: { ownerKey: string | null } | null,
  fn: (ownerKey: string) => Promise<CartResult>,
): Promise<CartResult> {
  if (!shopper) return NO_CART;
  if (!shopper.ownerKey) return EMPTY;
  const result = await fn(shopper.ownerKey);
  // Layout revalidate: header count, Menu steppers and /cart all read the Cart.
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function addToCartAction(dishId: string): Promise<CartResult> {
  const shopper = await ensureShopper();
  if (shopper && "error" in shopper) return { ok: false, error: shopper.error };
  return run(shopper, (key) => addItem(key, dishId));
}

export async function setQtyAction(dishId: string, qty: number): Promise<CartResult> {
  return run(await getShopper(), (key) => setQty(key, dishId, qty));
}

export async function removeFromCartAction(dishId: string): Promise<CartResult> {
  return run(await getShopper(), (key) => removeItem(key, dishId));
}

export async function removeUnavailableAction(): Promise<CartResult> {
  return run(await getShopper(), removeUnavailable);
}
