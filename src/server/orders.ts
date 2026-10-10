import { deliveryInstant, isValidDeliveryTime } from "@/lib/delivery-time";
import { checkoutSchema, ORDERS_PAGE_SIZE, type OrderFilters } from "@/lib/order-schemas";
import type { OrderStatus } from "@/lib/order-status";
import { type AccountFailure, fieldFailure, guard } from "@/server/accounts";
import { getCart } from "@/server/cart";
import { nextNumber } from "@/server/counter";
import { connectDb } from "@/server/db";
import { Cart } from "@/server/models/cart";
import { Order } from "@/server/models/order";
import { recordCheckoutTemplate } from "@/server/order-templates";
import { escapeRegExp, parseObjectId } from "@/server/queries/menu";
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
  const { timezone, schedule } = await getSettings();
  if (!isValidDeliveryTime(schedule, timezone, data.deliveryDate, data.deliveryTime, now)) {
    return fieldFailure({ deliveryTime: ["Choose an available delivery time."] });
  }
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
  if (ctx.userId) {
    await recordCheckoutTemplate(
      ctx.userId,
      { name: data.name, phone: data.phone, address: data.address },
      data.saveTemplate,
      now,
    );
  }
  return { ok: true, number, totalCents: cart.totalCents };
}

export type OrderRow = {
  id: string;
  number: number;
  createdAt: Date;
  deliveryAt: Date;
  items: { name: string; qty: number }[];
  totalCents: number;
  status: OrderStatus;
};

export type OrderPage = { orders: OrderRow[]; total: number; page: number; pageCount: number };

const nextDay = (date: string) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

export async function listUserOrders(
  userId: string,
  filters: OrderFilters,
  timezone: string,
): Promise<OrderPage> {
  await connectDb();
  const id = parseObjectId(userId);
  if (!id) return { orders: [], total: 0, page: 1, pageCount: 1 };
  const createdAt = {
    ...(filters.from && { $gte: deliveryInstant(filters.from, "00:00", timezone) }),
    ...(filters.to && { $lt: deliveryInstant(nextDay(filters.to), "00:00", timezone) }),
  };
  const query = {
    userId: id,
    ...(filters.status && { status: filters.status }),
    ...(filters.dish && {
      "items.nameSnapshot": { $regex: escapeRegExp(filters.dish), $options: "i" },
    }),
    ...(Object.keys(createdAt).length > 0 && { createdAt }),
  };
  const [rows, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip((filters.page - 1) * ORDERS_PAGE_SIZE)
      .limit(ORDERS_PAGE_SIZE)
      .lean(),
    Order.countDocuments(query),
  ]);
  return {
    orders: rows.map((o) => ({
      id: String(o._id),
      number: o.number,
      createdAt: o.createdAt,
      deliveryAt: o.deliveryAt,
      items: o.items.map((i) => ({ name: i.nameSnapshot, qty: i.qty })),
      totalCents: o.totalCents,
      status: o.status,
    })),
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)),
  };
}
