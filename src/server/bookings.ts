import { randomUUID, timingSafeEqual } from "node:crypto";
import { phoneField } from "@/lib/auth-schemas";
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_STATUSES,
  type BookingStatus,
  canUserCancel,
} from "@/lib/booking-status";
import { BOOKINGS_PAGE_SIZE, type BookingFilters, bookingSchema } from "@/lib/booking-schemas";
import {
  BOOKING_MINUTES,
  BOOKING_WINDOW_DAYS,
  type BookingDay,
  bookingOptions,
  isBookableSlot,
} from "@/lib/booking-slots";
import { type BookingTableRow, withCancellable } from "@/lib/booking-view";
import { deliveryInstant, MS_PER_DAY, MS_PER_MINUTE } from "@/lib/delivery-time";
import { type AccountFailure, fieldFailure, guard } from "@/server/accounts";
import { type CartView, checkCart } from "@/server/cart";
import { nextNumber } from "@/server/counter";
import { connectDb } from "@/server/db";
import { createMutex } from "@/server/mutex";
import { Booking } from "@/server/models/booking";
import { Cart } from "@/server/models/cart";
import type { OrderContext } from "@/server/orders";
import { parseObjectId } from "@/server/queries/menu";
import { getSettings } from "@/server/queries/settings";
import { createRateLimiter, type Limiter } from "@/server/rate-limit";

const bookingLimiter = createRateLimiter({ limit: 5, windowMs: 3_600_000 });
const bookingMutex = createMutex();

export type PlaceBookingResult = { ok: true; number: number; token: string } | AccountFailure;

async function listActiveStarts(now: Date): Promise<Date[]> {
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

export async function loadBookingDays(now: Date = new Date()): Promise<BookingDay[]> {
  const [settings, active] = await Promise.all([getSettings(), listActiveStarts(now)]);
  return bookingOptions(
    settings.schedule,
    settings.timezone,
    active,
    now,
    settings.maxConcurrentBookings,
  );
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
    const checkedCart = await checkCart(ctx.ownerKey, data.expectedTotalCents);
    if (!checkedCart.ok) return checkedCart;
    cart = checkedCart.cart;
  }
  // Mongo has no transaction here: the limit check and the insert must not interleave.
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
    const token = randomUUID();
    await Booking.create({
      number,
      viewToken: token,
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
    return { ok: true as const, number, token };
  });
  // No transactions: a crash between the create and this delete leaves the Cart full.
  if (cart && result.ok) await Cart.deleteOne({ ownerKey: ctx.ownerKey });
  return result;
}

export type BookingRow = {
  id: string;
  number: number;
  startsAt: Date;
  guests: number;
  items: { name: string; qty: number }[];
  totalCents: number;
  status: BookingStatus;
};

function mapItems(items: { nameSnapshot: string; qty: number }[]): BookingRow["items"] {
  return items.map((i) => ({ name: i.nameSnapshot, qty: i.qty }));
}

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
  const query: Record<string, unknown> = upcoming
    ? { userId: id, startsAt: { $gte: now }, status: { $ne: "cancelled" } }
    : { userId: id, $or: [{ startsAt: { $lt: now } }, { status: "cancelled" }] };
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
      items: mapItems(b.items),
      totalCents: b.totalCents,
      status: b.status,
    })),
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / BOOKINGS_PAGE_SIZE)),
  };
}

// One `now` decides both the tab split and which rows are still cancellable.
export async function loadUserBookingsPage(
  userId: string,
  filters: BookingFilters,
  now: Date = new Date(),
): Promise<Omit<BookingPage, "bookings"> & { bookings: BookingTableRow[] }> {
  const result = await listUserBookings(userId, filters, now);
  return { ...result, bookings: withCancellable(result.bookings, now) };
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

export type BookingConfirmation = Pick<
  BookingRow,
  "number" | "startsAt" | "guests" | "items" | "totalCents"
> & { mine: boolean };

function tokenMatches(stored: string | undefined, given: string | undefined): boolean {
  if (!stored || !given) return false;
  const a = Buffer.from(stored);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

// The Number is guessable, so contact is never selected; a User sees only their own Booking
// and a Guest needs the view token from the redirect.
export async function getBookingConfirmation(
  number: number,
  userId: string | null,
  token: string | undefined,
): Promise<BookingConfirmation | null> {
  await connectDb();
  if (!Number.isInteger(number)) return null;
  const booking = await Booking.findOne({ number })
    .select("number startsAt guests items totalCents userId +viewToken")
    .lean();
  if (!booking) return null;
  if (userId !== null ? String(booking.userId) !== userId : !tokenMatches(booking.viewToken, token))
    return null;
  return {
    number: booking.number,
    startsAt: booking.startsAt,
    guests: booking.guests,
    items: mapItems(booking.items),
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
