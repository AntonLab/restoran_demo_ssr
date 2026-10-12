import { describe, expect, test } from "vitest";
import { deliveryInstant, deliveryOptions, isValidDeliveryTime } from "@/lib/delivery-time";
import { WEEKDAYS, type ScheduleDay } from "@/lib/weekdays";

const schedule: ScheduleDay[] = WEEKDAYS.map((day) => ({
  day,
  open: "09:00",
  close: "22:00",
  closed: day === "Sun",
}));
const at = (iso: string) => new Date(iso);

describe("deliveryOptions", () => {
  test("today starts at now + 1 h rounded up to 15 minutes, close included", () => {
    const [today] = deliveryOptions(schedule, "UTC", at("2026-10-12T10:07:00Z"));
    expect(today.date).toBe("2026-10-12");
    expect(today.label).toBe("Mon, Oct 12");
    expect(today.times[0]).toBe("11:15");
    expect(today.times.at(-1)).toBe("22:00");
    expect(today.times).toContain("11:30");
  });
  test("an aligned threshold is not pushed further, seconds push it", () => {
    expect(deliveryOptions(schedule, "UTC", at("2026-10-12T10:00:00Z"))[0].times[0]).toBe("11:00");
    expect(deliveryOptions(schedule, "UTC", at("2026-10-12T10:00:01Z"))[0].times[0]).toBe("11:15");
  });
  test("before opening the day starts at open; later days start at open", () => {
    const days = deliveryOptions(schedule, "UTC", at("2026-10-12T06:00:00Z"));
    expect(days[0].times[0]).toBe("09:00");
    expect(days[1].times[0]).toBe("09:00");
    expect(days[1].date).toBe("2026-10-13");
  });
  test("an open time off the 15-minute grid is rounded up", () => {
    const odd = schedule.map((d) => ({ ...d, open: "09:10" }));
    expect(deliveryOptions(odd, "UTC", at("2026-10-12T05:00:00Z"))[0].times[0]).toBe("09:15");
  });
  test("a day with no slots left is omitted", () => {
    expect(deliveryOptions(schedule, "UTC", at("2026-10-12T21:30:00Z"))[0].date).toBe("2026-10-13");
    const late = deliveryOptions(schedule, "UTC", at("2026-10-12T23:30:00Z"));
    expect(late[0].date).toBe("2026-10-13");
    expect(late[0].times[0]).toBe("09:00");
  });
  test("closed days are skipped and the window is today plus 6 days", () => {
    const days = deliveryOptions(schedule, "UTC", at("2026-10-12T06:00:00Z"));
    expect(days.map((d) => d.date)).not.toContain("2026-10-18");
    expect(days).toHaveLength(6);
    const tue = deliveryOptions(schedule, "UTC", at("2026-10-13T06:00:00Z"));
    expect(tue.at(-1)?.date).toBe("2026-10-19");
  });
  test("uses the venue timezone for today", () => {
    const [today] = deliveryOptions(schedule, "Asia/Tokyo", at("2026-10-12T23:30:00Z"));
    expect(today.date).toBe("2026-10-13");
    expect(today.times[0]).toBe("09:30");
  });
  test("an unknown timezone falls back to UTC instead of throwing", () => {
    expect(deliveryOptions(schedule, "Nowhere/Land", at("2026-10-12T06:00:00Z"))[0].date).toBe(
      "2026-10-12",
    );
  });
});

describe("isValidDeliveryTime", () => {
  const now = at("2026-10-12T10:07:00Z");
  test("accepts offered slots only", () => {
    expect(isValidDeliveryTime(schedule, "UTC", "2026-10-12", "11:15", now)).toBe(true);
    expect(isValidDeliveryTime(schedule, "UTC", "2026-10-12", "22:00", now)).toBe(true);
    expect(isValidDeliveryTime(schedule, "UTC", "2026-10-12", "11:00", now)).toBe(false);
    expect(isValidDeliveryTime(schedule, "UTC", "2026-10-12", "22:15", now)).toBe(false);
    expect(isValidDeliveryTime(schedule, "UTC", "2026-10-13", "10:10", now)).toBe(false);
    expect(isValidDeliveryTime(schedule, "UTC", "2026-10-18", "12:00", now)).toBe(false);
    expect(isValidDeliveryTime(schedule, "UTC", "2026-10-20", "12:00", now)).toBe(false);
    expect(isValidDeliveryTime(schedule, "UTC", "2026-10-11", "12:00", now)).toBe(false);
  });
});

describe("deliveryInstant", () => {
  test("converts venue wall time to a UTC instant", () => {
    expect(deliveryInstant("2026-10-12", "18:30", "Asia/Tokyo").toISOString()).toBe(
      "2026-10-12T09:30:00.000Z",
    );
    expect(deliveryInstant("2026-01-15", "09:00", "America/New_York").toISOString()).toBe(
      "2026-01-15T14:00:00.000Z",
    );
    expect(deliveryInstant("2026-07-15", "09:00", "America/New_York").toISOString()).toBe(
      "2026-07-15T13:00:00.000Z",
    );
  });
});
