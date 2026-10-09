import type { ScheduleDay } from "@/lib/weekdays";

function weekdayIn(timeZone: string, now: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
}

export function getTodayHours(
  schedule: ScheduleDay[],
  timezone: string,
  now: Date = new Date(),
): ScheduleDay | undefined {
  let weekday: string;
  try {
    weekday = weekdayIn(timezone, now);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    weekday = weekdayIn("UTC", now);
  }
  return schedule.find((entry) => entry.day === weekday);
}

export function formatHours(day: ScheduleDay | undefined): string {
  return !day || day.closed ? "Closed" : `${day.open} – ${day.close}`;
}
