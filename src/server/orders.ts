import { deliveryInstant } from "@/lib/delivery-time";
import { checkoutSchema } from "@/lib/order-schemas";
import { type AccountFailure, guard } from "@/server/accounts";
import { getCart } from "@/server/cart";
import { nextNumber } from "@/server/counter";
import { connectDb } from "@/server/db";
import { Cart } from "@/server/models/cart";
import { Order } from "@/server/models/order";
import { getSettings } from "@/server/queries/settings";
import { createRateLimiter, type Limiter } from "@/server/rate-limit";

export const orderLimiter = createRateLimiter({ limit: 10, windowMs: 3_600_000 });

export type OrderContext = {
  ownerKey: string | null;
  userId: string | null;
  role: "guest" | "user" | "admin";
  ip: string;
};

export type PlaceOrderResult = { ok: true; number: number; totalCents: number } | AccountFailure;

const EMPTY_CART: AccountFailure = { ok: false, error: "Your cart is empty." };

export async function placeOrder(
  input: unknown,
  ctx: OrderContext,
  limiter: Limiter = orderLimiter,
  now: Date = new Date(),
): Promise<PlaceOrderResult> {
  if (ctx.role === "admin") return { ok: false, error: "Admins cannot place orders." };
  const checked = guard(checkoutSchema, input, limiter, () => ctx.ip);
  if ("failure" in checked) return checked.failure;
  const data = checked.data;
  await connectDb();
  if (!ctx.ownerKey) return EMPTY_CART;
  const cart = await getCart(ctx.ownerKey);
  if (cart.lines.length === 0) return EMPTY_CART;
  if (cart.hasUnavailable) {
    const names = cart.lines.filter((l) => l.unavailable).map((l) => l.name);
    return {
      ok: false,
      error: `Some dishes are unavailable: ${names.join(", ")}. Remove them to continue.`,
    };
  }
  if (cart.totalCents !== data.expectedTotalCents) {
    return { ok: false, error: "Prices changed, review your cart" };
  }
  const { timezone } = await getSettings();
  // No transactions (accepted in the spec): two parallel submits may both pass the
  // checks above and create two Orders; a failed create burns a Number.
  const number = await nextNumber("order");
  await Order.create({
    number,
    userId: ctx.userId,
    customer: { name: data.name, phone: data.phone },
    address: data.address,
    deliveryAt: deliveryInstant(data.deliveryDate, data.deliveryTime, timezone),
    items: cart.lines.map((l) => ({
      dishId: l.dishId,
      nameSnapshot: l.name,
      priceCentsSnapshot: l.priceCents,
      qty: l.qty,
    })),
    totalCents: cart.totalCents,
    status: "new",
    history: [{ status: "new", at: now }],
  });
  await Cart.deleteOne({ ownerKey: ctx.ownerKey });
  return { ok: true, number, totalCents: cart.totalCents };
}
