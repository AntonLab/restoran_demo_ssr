import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIp } from "@/lib/client-ip";
import { getSession } from "@/server/auth/session";
import {
  CART_COOKIE,
  cartCookieOptions,
  checkNewCartRate,
  newCid,
  resolveShopper,
  type Shopper,
} from "@/server/auth/shopper";
import { guestCartKey } from "@/server/cart";
import { createRateLimiter } from "@/server/rate-limit";

export const NEW_GUEST_CARTS_PER_HOUR = 30;
export const newCartLimiter = createRateLimiter({
  limit: NEW_GUEST_CARTS_PER_HOUR,
  windowMs: 3_600_000,
});

export async function getShopper(): Promise<Shopper | null> {
  return resolveShopper(await getSession(), (await cookies()).get(CART_COOKIE)?.value);
}

export async function requireShopper(): Promise<Shopper> {
  const shopper = await getShopper();
  if (!shopper) redirect("/admin");
  return shopper;
}

// Cookie writes only work in Server Actions and Route Handlers, never while rendering.
export async function ensureShopper(): Promise<
  (Shopper & { ownerKey: string }) | { error: string } | null
> {
  const shopper = await getShopper();
  if (!shopper) return null;
  if (shopper.ownerKey) return { ...shopper, ownerKey: shopper.ownerKey };
  const error = checkNewCartRate(newCartLimiter, clientIp(await headers()));
  if (error) return { error };
  const cid = newCid();
  (await cookies()).set(CART_COOKIE, cid, cartCookieOptions(process.env.NODE_ENV === "production"));
  return { ...shopper, ownerKey: guestCartKey(cid) };
}
