import { phoneField } from "@/lib/auth-schemas";
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_STATUSES,
  type BookingStatus,
  canUserCancel,
} from "@/lib/booking-status";
import { BOOKINGS_PAGE_SIZE, type BookingFilters, bookingSchema } from "@/lib/booking-schemas";
import { BOOKING_MINUTES, BOOKING_WINDOW_DAYS, isBookableSlot } from "@/lib/booking-slots";
import { deliveryInstant } from "@/lib/delivery-time";
import { type AccountFailure, fieldFailure, guard } from "@/server/accounts";
import { type CartView, getCart } from "@/server/cart";
import { nextNumber } from "@/server/counter";
import { connectDb } from "@/server/db";
import { createMutex } from "@/server/mutex";
import { Booking } from "@/server/models/booking";
import { Cart } from "@/server/models/cart";
import type { OrderContext } from "@/server/orders";
import { parseObjectId } from "@/server/queries/menu";
import { getSettings } from "@/server/queries/settings";
import { createRateLimiter, type Limiter } from "@/server/rate-limit";

export const bookingLimiter = createRateLimiter({ limit: 5, windowMs: 3_600_000 });
export const bookingMutex = createMutex();

export type PlaceBookingResult = { ok: true; number: number } | AccountFailure;

const EMPTY_CART: AccountFailure = { ok: false, error: "Your cart is empty." };
const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

export async function listActiveStarts(now: Date): Promise<Date[]> {
  const margin = BOOKING_MINUTES * MS_PER_MINUTE;
  const rows = await Booking.find({
    status: { $in: ACTIVE_BOOKING_STATUSES },
    startsAt: {
      $gte: new Date(now.getTime() - margin),
      $lte: new Date(now.getTime() + (BOOKING_WINDOW_DAYS + 1) * MS_PER_DAY + margin),
    },
  })
    .select("startsAt")
    .lean();
  return rows.map((b) => b.startsAt);
}

export async function placeBooking(
  input: unknown,
  ctx: OrderContext,
  limiter: Limiter = bookingLimiter,
  now: Date = new Date(),
): Promise<PlaceBookingResult> {
  if (ctx.role === "admin") return { ok: false, error: "Admins cannot book a table." };
  const checked = guard(bookingSchema, input, limiter, () => ctx.ip);
  if ("failure" in checked) return checked.failure;
  const data = checked.data;
  await connectDb();
  let cart: CartView | null = null;
  if (data.preorder) {
    if (!ctx.ownerKey) return EMPTY_CART;
    cart = await getCart(ctx.ownerKey);
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
  }
  // Mongo has no transaction here: the limit check and the insert must not interleave
  // between two requests. One Node process, so an in-memory lock is enough.
  const result = await bookingMutex.run(async () => {
    const { timezone, schedule, maxConcurrentBookings } = await getSettings();
    const active = await listActiveStarts(now);
    // Closed or too-soon Slots share the message: the page never offers them.
    if (
      !isBookableSlot(schedule, timezone, active, data.date, data.time, now, maxConcurrentBookings)
    ) {
      return fieldFailure({ time: ["This time is fully booked, pick another"] });
    }
    const number = await nextNumber("booking");
    await Booking.create({
      number,
      userId: ctx.userId,
      contact: { name: data.name, phone: data.phone },
      startsAt: deliveryInstant(data.date, data.time, timezone),
      guests: data.guests,
      items:
        cart?.lines.map((l) => ({
          dishId: l.dishId,
          nameSnapshot: l.name,
          priceCentsSnapshot: l.priceCents,
          qty: l.qty,
        })) ?? [],
      totalCents: cart?.totalCents ?? 0,
      status: "new",
      history: [{ status: "new", at: now }],
    });
    return { ok: true as const, number };
  });
  // No transactions: a crash between the create and this delete leaves the Cart full.
  if (cart && result.ok) await Cart.deleteOne({ ownerKey: ctx.ownerKey });
  return result;
}

// Pages cannot call `new Date()` during render (react/purity), so they take the clock from here.
export const bookingClock = (): Date => new Date();

export type BookingRow = {
  id: string;
  number: number;
  startsAt: Date;
  guests: number;
  items: { name: string; qty: number }[];
  totalCents: number;
  status: BookingStatus;
};

export type BookingPage = {
  bookings: BookingRow[];
  total: number;
  page: number;
  pageCount: number;
};

export async function listUserBookings(
  userId: string,
  filters: BookingFilters,
  now: Date = new Date(),
): Promise<BookingPage> {
  await connectDb();
  const id = parseObjectId(userId);
  if (!id) return { bookings: [], total: 0, page: 1, pageCount: 1 };
  const upcoming = filters.tab === "upcoming";
  const query = { userId: id, startsAt: upcoming ? { $gte: now } : { $lt: now } };
  const direction = upcoming ? 1 : -1;
  const [rows, total] = await Promise.all([
    Booking.find(query)
      .sort({ startsAt: direction, _id: direction })
      .skip((filters.page - 1) * BOOKINGS_PAGE_SIZE)
      .limit(BOOKINGS_PAGE_SIZE)
      .lean(),
    Booking.countDocuments(query),
  ]);
  return {
    bookings: rows.map((b) => ({
      id: String(b._id),
      number: b.number,
      startsAt: b.startsAt,
      guests: b.guests,
      items: b.items.map((i) => ({ name: i.nameSnapshot, qty: i.qty })),
      totalCents: b.totalCents,
      status: b.status,
    })),
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / BOOKINGS_PAGE_SIZE)),
  };
}

export type BookingCancelResult =
  | { ok: true }
  | { ok: false; error: string; status?: BookingStatus };

const NOT_FOUND = { ok: false, error: "Booking not found." } as const;
const cancellable = BOOKING_STATUSES.filter(canUserCancel);

export async function cancelUserBooking(
  userId: string,
  number: number,
  now: Date = new Date(),
): Promise<BookingCancelResult> {
  await connectDb();
  const id = parseObjectId(userId);
  if (!id || !Number.isInteger(number) || number < 1) return NOT_FOUND;
  // The status in the filter makes the check and the write one atomic step, so two
  // parallel cancels (or an admin change in between) cannot both succeed.
  const hit = await Booking.findOneAndUpdate(
    { number, userId: id, status: { $in: cancellable }, startsAt: { $gt: now } },
    {
      $set: { status: "cancelled" },
      $push: { history: { status: "cancelled", at: now, by: "user" } },
    },
  );
  if (hit) return { ok: true };
  const booking = await Booking.findOne({ number, userId: id }).select("status").lean();
  if (!booking) return NOT_FOUND;
  return { ok: false, error: "This booking can no longer be cancelled", status: booking.status };
}

export type BookingConfirmation = {
  number: number;
  startsAt: Date;
  guests: number;
  items: { name: string; qty: number }[];
  totalCents: number;
  mine: boolean;
};

// The Number is guessable, so contact is never selected and a signed-in User sees only their own.
export async function getBookingConfirmation(
  number: number,
  userId: string | null,
): Promise<BookingConfirmation | null> {
  await connectDb();
  if (!Number.isInteger(number)) return null;
  const booking = await Booking.findOne({ number })
    .select("number startsAt guests items totalCents userId")
    .lean();
  if (!booking) return null;
  if (userId !== null && String(booking.userId) !== userId) return null;
  return {
    number: booking.number,
    startsAt: booking.startsAt,
    guests: booking.guests,
    items: booking.items.map((i) => ({ name: i.nameSnapshot, qty: i.qty })),
    totalCents: booking.totalCents,
    mine: userId !== null,
  };
}

// The userId: null filter keeps other Users' Bookings safe; a malformed phone must never match every Guest Booking.
export async function attachGuestBookings(userId: string, phone: string): Promise<number> {
  await connectDb();
  const id = parseObjectId(userId);
  const parsed = phoneField.safeParse(phone);
  if (!id || !parsed.success) return 0;
  const result = await Booking.updateMany(
    { userId: null, "contact.phone": parsed.data },
    { $set: { userId: id } },
  );
  return result.modifiedCount;
}
