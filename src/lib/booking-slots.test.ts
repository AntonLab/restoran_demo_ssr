import { describe, expect, test } from "vitest";
import { bookingOptions, isBookableSlot } from "@/lib/booking-slots";
import { WEEKDAYS, type ScheduleDay } from "@/lib/weekdays";

const week = (open = "09:00", close = "22:00", closedDays: string[] = ["Sun"]): ScheduleDay[] =>
  WEEKDAYS.map((day) => ({ day, open, close, closed: closedDays.includes(day) }));
const NOW = new Date("2026-10-12T10:07:00Z"); // Monday
const at = (iso: string) => new Date(iso);
const times = (days: ReturnType<typeof bookingOptions>, date: string) =>
  days.find((d) => d.date === date)?.times;

describe("bookingOptions", () => {
  test("first Slot is now + 1 h rounded up to 30 min, last is close - 2 h", () => {
    const today = bookingOptions(week(), "UTC", [], NOW, 5)[0];
    expect(today.date).toBe("2026-10-12");
    expect(today.times[0]).toBe("11:30");
    expect(today.times.at(-1)).toBe("20:00");
  });
  test("now + 1 h exactly is allowed, one minute later is not", () => {
    expect(
      times(bookingOptions(week(), "UTC", [], at("2026-10-12T19:00:00Z"), 5), "2026-10-12"),
    ).toEqual(["20:00"]);
    expect(bookingOptions(week(), "UTC", [], at("2026-10-12T19:01:00Z"), 5)[0].date).toBe(
      "2026-10-13",
    );
  });
  test("covers 30 days and skips closed days", () => {
    const days = bookingOptions(week(), "UTC", [], NOW, 5);
    expect(days).toHaveLength(26);
    expect(days.at(-1)?.date).toBe("2026-11-10");
    expect(times(days, "2026-10-18")).toBeUndefined();
  });
  test("a day shorter than 2 h or with close <= open has no Slot", () => {
    const short = week().map((d) =>
      d.day === "Tue" ? { ...d, open: "10:00", close: "11:30" } : d,
    );
    const overnight = week().map((d) =>
      d.day === "Tue" ? { ...d, open: "18:00", close: "02:00" } : d,
    );
    expect(times(bookingOptions(short, "UTC", [], NOW, 5), "2026-10-13")).toBeUndefined();
    expect(times(bookingOptions(overnight, "UTC", [], NOW, 5), "2026-10-13")).toBeUndefined();
    const exact = week().map((d) =>
      d.day === "Tue" ? { ...d, open: "10:00", close: "12:00" } : d,
    );
    expect(times(bookingOptions(exact, "UTC", [], NOW, 5), "2026-10-13")).toEqual(["10:00"]);
  });
  test("uses the Settings timezone", () => {
    const days = bookingOptions(week(), "America/New_York", [], at("2026-10-12T12:07:00Z"), 5);
    expect(days[0].times[0]).toBe("09:30"); // 08:07 EDT + 1 h
  });
  test("DST: a Booking at 09:00 EST on the fall-back day blocks 09:00-10:30 only", () => {
    const all = week("09:00", "22:00", []);
    const days = bookingOptions(
      all,
      "America/New_York",
      [at("2026-11-01T14:00:00Z")],
      at("2026-10-30T12:00:00Z"),
      1,
    );
    const day = times(days, "2026-11-01") ?? [];
    expect(day).not.toContain("09:00");
    expect(day).not.toContain("10:30");
    expect(day).toContain("11:00");
  });
  test("limit 2, A 18:00 and B 20:00: 19:00 is still offered", () => {
    const active = [at("2026-10-13T18:00:00Z"), at("2026-10-13T20:00:00Z")];
    expect(times(bookingOptions(week(), "UTC", active, NOW, 2), "2026-10-13")).toContain("19:00");
  });
  test("limit 2, A 18:00 and B 19:00: every Slot whose window shares the 19:00 cell is hidden", () => {
    const active = [at("2026-10-13T18:00:00Z"), at("2026-10-13T19:00:00Z")];
    const day = times(bookingOptions(week(), "UTC", active, NOW, 2), "2026-10-13") ?? [];
    for (const hidden of ["17:30", "18:00", "18:30", "19:00", "19:30"])
      expect(day).not.toContain(hidden);
    for (const shown of ["17:00", "20:00"]) expect(day).toContain(shown);
  });
});

const ok = (d: string, t: string) => isBookableSlot(week(), "UTC", [], d, t, NOW, 5);

describe("isBookableSlot", () => {
  test("true for an offered Slot, false off-grid, closed, past and malformed", () => {
    expect(ok("2026-10-13", "12:00")).toBe(true);
    expect(ok("2026-10-13", "18:15")).toBe(false);
    expect(ok("2026-10-13", "20:30")).toBe(false);
    expect(ok("2026-10-18", "12:00")).toBe(false);
    expect(ok("2026-10-12", "10:00")).toBe(false);
    expect(ok("2026-02-30", "12:00")).toBe(false);
    expect(ok("2026-10-13", "25:99")).toBe(false);
  });
  test("false when the limit is reached", () => {
    const active = [at("2026-10-13T12:00:00Z")];
    expect(isBookableSlot(week(), "UTC", active, "2026-10-13", "12:00", NOW, 1)).toBe(false);
    expect(isBookableSlot(week(), "UTC", active, "2026-10-13", "12:00", NOW, 2)).toBe(true);
  });
});
