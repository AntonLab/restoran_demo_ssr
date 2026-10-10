import { WEEKDAYS, type ScheduleDay } from "@/lib/weekdays";

export type DeliveryDay = { date: string; label: string; times: string[] };

const STEP = 15;
const LEAD_MINUTES = 60;
const WINDOW_DAYS = 7;
const MS_PER_DAY = 86_400_000;

function localParts(instant: Date, timeZone: string) {
  const format = (zone: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).formatToParts(instant);
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = format(timeZone);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    parts = format("UTC");
  }
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    seconds: value("hour") * 3600 + value("minute") * 60 + value("second"),
  };
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function deliveryOptions(
  schedule: ScheduleDay[],
  timezone: string,
  now: Date = new Date(),
): DeliveryDay[] {
  const local = localParts(now, timezone);
  // Wall-clock arithmetic on purpose: a DST shift inside the next 7 days moves a
  // shown slot by at most an hour, while deliveryInstant stores the exact instant.
  const threshold = local.seconds / 60 + LEAD_MINUTES;
  const days: DeliveryDay[] = [];
  for (let offset = 0; offset < WINDOW_DAYS; offset++) {
    const date = new Date(Date.UTC(local.year, local.month - 1, local.day) + offset * MS_PER_DAY);
    const entry = schedule.find((d) => d.day === WEEKDAYS[(date.getUTCDay() + 6) % 7]);
    if (!entry || entry.closed) continue;
    const openMin = toMinutes(entry.open);
    const closeMin = toMinutes(entry.close);
    if (closeMin <= openMin) continue;
    const times: string[] = [];
    for (
      let minute = Math.ceil(Math.max(openMin, threshold - offset * 1440) / STEP) * STEP;
      minute <= closeMin;
      minute += STEP
    ) {
      times.push(`${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`);
    }
    if (times.length === 0) continue;
    days.push({
      date: date.toISOString().slice(0, 10),
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

export function isValidDeliveryTime(
  schedule: ScheduleDay[],
  timezone: string,
  date: string,
  time: string,
  now: Date = new Date(),
): boolean {
  return (
    deliveryOptions(schedule, timezone, now)
      .find((day) => day.date === date)
      ?.times.includes(time) ?? false
  );
}

export function deliveryInstant(date: string, time: string, timezone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const wall = Date.UTC(year, month - 1, day, hours, minutes);
  const offsetAt = (ms: number) => {
    const p = localParts(new Date(ms), timezone);
    return Date.UTC(p.year, p.month - 1, p.day) + p.seconds * 1000 - Math.floor(ms / 1000) * 1000;
  };
  // Second pass: the first guess can land on the other side of a DST change.
  return new Date(wall - offsetAt(wall - offsetAt(wall)));
}
