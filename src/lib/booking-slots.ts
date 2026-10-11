import {
  dayLabel,
  deliveryInstant,
  localParts,
  MS_PER_DAY,
  MS_PER_MINUTE,
  pad,
  scheduleEntryFor,
  toMinutes,
  type DeliveryDay,
} from "@/lib/delivery-time";
import type { ScheduleDay } from "@/lib/weekdays";

export const BOOKING_MINUTES = 120;
const SLOT_STEP = 30;
export const BOOKING_WINDOW_DAYS = 30;
const BOOKING_LEAD_MINUTES = 60;

export type BookingDay = DeliveryDay;

// Count of sorted values <= x.
function countUpTo(sorted: number[], x: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function slotHasRoom(instant: Date, sortedStarts: number[], limit: number): boolean {
  for (let k = 0; k < BOOKING_MINUTES / SLOT_STEP; k++) {
    const cell = instant.getTime() + k * SLOT_STEP * MS_PER_MINUTE;
    // A Booking covers the cell when its start is in (cell - BOOKING_MINUTES, cell].
    const covering =
      countUpTo(sortedStarts, cell) -
      countUpTo(sortedStarts, cell - BOOKING_MINUTES * MS_PER_MINUTE);
    if (covering + 1 > limit) return false;
  }
  return true;
}

export function bookingOptions(
  schedule: ScheduleDay[],
  timezone: string,
  active: Date[],
  now: Date,
  limit: number,
): BookingDay[] {
  const local = localParts(now, timezone);
  const earliest = now.getTime() + BOOKING_LEAD_MINUTES * MS_PER_MINUTE;
  const sortedStarts = active.map((a) => a.getTime()).toSorted((a, b) => a - b);
  const days: BookingDay[] = [];
  for (let offset = 0; offset < BOOKING_WINDOW_DAYS; offset++) {
    const date = new Date(Date.UTC(local.year, local.month - 1, local.day) + offset * MS_PER_DAY);
    const entry = scheduleEntryFor(schedule, date);
    if (!entry || entry.closed) continue;
    const openMin = toMinutes(entry.open);
    const closeMin = toMinutes(entry.close);
    const isoDate = date.toISOString().slice(0, 10);
    const times: string[] = [];
    // Wall-clock grid but instant comparisons, so DST days stay correct.
    for (let minute = openMin; minute <= closeMin - BOOKING_MINUTES; minute += SLOT_STEP) {
      const time = `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`;
      const instant = deliveryInstant(isoDate, time, timezone);
      if (instant.getTime() >= earliest && slotHasRoom(instant, sortedStarts, limit))
        times.push(time);
    }
    if (times.length === 0) continue;
    days.push({ date: isoDate, label: dayLabel(date), times });
  }
  return days;
}

export function isBookableSlot(
  schedule: ScheduleDay[],
  timezone: string,
  active: Date[],
  date: string,
  time: string,
  now: Date,
  limit: number,
): boolean {
  return (
    bookingOptions(schedule, timezone, active, now, limit)
      .find((day) => day.date === date)
      ?.times.includes(time) ?? false
  );
}
