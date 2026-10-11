import { deliveryInstant, localParts } from "@/lib/delivery-time";
import { WEEKDAYS, type ScheduleDay } from "@/lib/weekdays";

export const BOOKING_MINUTES = 120;
const SLOT_STEP = 30;
export const BOOKING_WINDOW_DAYS = 30;
const BOOKING_LEAD_MINUTES = 60;

export type BookingDay = { date: string; label: string; times: string[] };

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const pad = (n: number) => String(n).padStart(2, "0");

function slotHasRoom(instant: Date, active: Date[], limit: number): boolean {
  for (let k = 0; k < BOOKING_MINUTES / SLOT_STEP; k++) {
    const cell = instant.getTime() + k * SLOT_STEP * MS_PER_MINUTE;
    const covering = active.filter((a) => {
      const start = a.getTime();
      return start <= cell && cell < start + BOOKING_MINUTES * MS_PER_MINUTE;
    }).length;
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
  const days: BookingDay[] = [];
  for (let offset = 0; offset < BOOKING_WINDOW_DAYS; offset++) {
    const date = new Date(Date.UTC(local.year, local.month - 1, local.day) + offset * MS_PER_DAY);
    const entry = schedule.find((d) => d.day === WEEKDAYS[(date.getUTCDay() + 6) % 7]);
    if (!entry || entry.closed) continue;
    const openMin = toMinutes(entry.open);
    const closeMin = toMinutes(entry.close);
    const isoDate = date.toISOString().slice(0, 10);
    const times: string[] = [];
    // Wall-clock grid but instant comparisons, so DST days stay correct.
    for (let minute = openMin; minute <= closeMin - BOOKING_MINUTES; minute += SLOT_STEP) {
      const time = `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`;
      const instant = deliveryInstant(isoDate, time, timezone);
      if (instant.getTime() >= earliest && slotHasRoom(instant, active, limit)) times.push(time);
    }
    if (times.length === 0) continue;
    days.push({
      date: isoDate,
      label: new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(date),
      times,
    });
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
