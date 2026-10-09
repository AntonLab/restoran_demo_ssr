import { describe, expect, test } from "vitest";
import { formatHours, getTodayHours } from "@/lib/hours";
import { WEEKDAYS, type ScheduleDay } from "@/lib/weekdays";

const schedule: ScheduleDay[] = WEEKDAYS.map((day) => ({
  day,
  open: "10:00",
  close: "22:00",
  closed: day === "Sun",
}));
// Friday 2026-10-09 23:30 UTC
const now = new Date("2026-10-09T23:30:00Z");

describe("getTodayHours", () => {
  test("uses the weekday in the venue timezone", () => {
    expect(getTodayHours(schedule, "America/Los_Angeles", now)?.day).toBe("Fri");
    expect(getTodayHours(schedule, "Asia/Tokyo", now)?.day).toBe("Sat");
  });
  test("falls back to UTC for an invalid timezone", () => {
    expect(getTodayHours(schedule, "Not/AZone", now)?.day).toBe("Fri");
  });
  test("empty schedule gives undefined", () => {
    expect(getTodayHours([], "UTC", now)).toBeUndefined();
  });
});

describe("formatHours", () => {
  test("formats open, closed and missing days", () => {
    expect(formatHours(schedule[0])).toBe("10:00 – 22:00");
    expect(formatHours(schedule[6])).toBe("Closed");
    expect(formatHours(undefined)).toBe("Closed");
  });
});
