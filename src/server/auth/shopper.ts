import { guestCartKey, userCartKey } from "@/server/cart";
import type { OrderContext } from "@/server/orders";
import { formatRetry, type Limiter } from "@/server/rate-limit";
import type { SessionInfo } from "@/server/auth/session-store";

export const CART_COOKIE = "cid";
export const CART_COOKIE_MAX_AGE = 2_592_000;

export const cartCookieOptions = (secure: boolean) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure,
  path: "/",
  maxAge: CART_COOKIE_MAX_AGE,
});

export const newCid = () => crypto.randomUUID();

// Lower case only and no trimming: a forged cookie value must never become a Cart key.
const CID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const parseCid = (raw: string | null | undefined): string | null =>
  raw && CID_PATTERN.test(raw) ? raw : null;

export type Shopper = {
  role: "guest" | "user";
  userId: string | null;
  ownerKey: string | null;
};

// null means Admin: an Admin has no Cart.
export function resolveShopper(
  session: SessionInfo | null,
  rawCid: string | null | undefined,
): Shopper | null {
  if (session?.user.role === "admin") return null;
  if (session) {
    return { role: "user", userId: session.user.id, ownerKey: userCartKey(session.user.id) };
  }
  const cid = parseCid(rawCid);
  return { role: "guest", userId: null, ownerKey: cid ? guestCartKey(cid) : null };
}

// Only issuing a new cid counts: each one is a new Guest Cart row, so a client that drops its
// cookie could otherwise create them without bound. Returns the error text, or null when allowed.
export function checkNewCartRate(limiter: Limiter, ip: string): string | null {
  const hit = limiter.hit(ip);
  return hit.ok ? null : `Too many attempts. Try again in ${formatRetry(hit.retryAfterMs)}.`;
}

export const toOrderContext = (shopper: Shopper, ip: string): OrderContext => ({
  ownerKey: shopper.ownerKey,
  userId: shopper.userId,
  role: shopper.role,
  ip,
});
