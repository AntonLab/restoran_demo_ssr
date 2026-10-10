import { describe, expect, test } from "vitest";
import { initialDelivery, pickTime } from "@/lib/delivery-pick";

const days = [
  { date: "2026-10-12", label: "Mon, Oct 12", times: ["11:15", "11:30"] },
  { date: "2026-10-13", label: "Tue, Oct 13", times: ["09:00", "09:15", "11:30"] },
];

describe("pickTime", () => {
  test("keeps the current time when the day has it", () => {
    expect(pickTime(days[1].times, "11:30")).toBe("11:30");
  });
  test("falls back to the first slot when the day lacks it", () => {
    expect(pickTime(days[0].times, "09:15")).toBe("11:15");
  });
  test("returns an empty string for a day with no slots", () => {
    expect(pickTime([], "11:30")).toBe("");
  });
});

describe("initialDelivery", () => {
  test("starts at the first day and its first slot", () => {
    expect(initialDelivery(days)).toEqual({ date: "2026-10-12", time: "11:15" });
  });
  test("is empty when the venue offers no slot this week", () => {
    expect(initialDelivery([])).toEqual({ date: "", time: "" });
  });
});
