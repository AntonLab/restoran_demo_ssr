import { ACTIVE_BOOKING_STATUSES } from "@/lib/booking-status";
import { bookingSchema } from "@/lib/booking-schemas";
import { BOOKING_MINUTES, BOOKING_WINDOW_DAYS, isBookableSlot } from "@/lib/booking-slots";
import { deliveryInstant } from "@/lib/delivery-time";
import { type AccountFailure, fieldFailure, guard } from "@/server/accounts";
import { nextNumber } from "@/server/counter";
import { connectDb } from "@/server/db";
import { createMutex } from "@/server/mutex";
import { Booking } from "@/server/models/booking";
import type { OrderContext } from "@/server/orders";
import { getSettings } from "@/server/queries/settings";
import { createRateLimiter, type Limiter } from "@/server/rate-limit";

export const bookingLimiter = createRateLimiter({ limit: 5, windowMs: 3_600_000 });
export const bookingMutex = createMutex();

export type PlaceBookingResult = { ok: true; number: number } | AccountFailure;

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
  // Mongo has no transaction here: the limit check and the insert must not interleave
  // between two requests. One Node process, so an in-memory lock is enough.
  return bookingMutex.run(async () => {
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
      items: [],
      totalCents: 0,
      status: "new",
      history: [{ status: "new", at: now }],
    });
    return { ok: true as const, number };
  });
}
