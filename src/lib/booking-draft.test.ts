import { afterEach, describe, expect, test, vi } from "vitest";
import { clearDraft, parseDraft, restoreDraft, saveDraft, takeDraft } from "@/lib/booking-draft";
import type { BookingDay } from "@/lib/booking-slots";

const days: BookingDay[] = [
  { date: "2026-10-12", label: "Mon", times: ["18:00", "18:30"] },
  { date: "2026-10-13", label: "Tue", times: ["19:00"] },
];
const draft = {
  name: "Ann",
  phone: "+1 555 0100",
  guests: "4",
  date: "2026-10-13",
  time: "19:00",
  preorder: true,
};

describe("parseDraft", () => {
  test("accepts a stored draft", () => {
    expect(parseDraft(JSON.stringify(draft))).toEqual(draft);
  });

  test.each([null, "", "not json", "[]", "null", JSON.stringify({ ...draft, guests: 4 })])(
    "ignores malformed input %j",
    (raw) => {
      expect(parseDraft(raw)).toBeNull();
    },
  );
});

describe("draft storage", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("clearDraft removes a saved draft", () => {
    const map = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
    });
    saveDraft(draft);
    clearDraft();
    expect(takeDraft()).toBeNull();
  });

  test("clearDraft does not throw when storage is blocked", () => {
    vi.stubGlobal("sessionStorage", {
      removeItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() => clearDraft()).not.toThrow();
  });
});

describe("restoreDraft", () => {
  test("keeps every field when the slot is still offered", () => {
    expect(restoreDraft(draft, days)).toEqual(draft);
  });

  test("drops date and time when the day is no longer offered", () => {
    expect(restoreDraft({ ...draft, date: "2026-09-01" }, days)).toEqual({
      name: "Ann",
      phone: "+1 555 0100",
      guests: "4",
      preorder: true,
    });
  });

  test("drops only the time when the day stays but the time is gone", () => {
    expect(restoreDraft({ ...draft, date: "2026-10-12", time: "23:00" }, days)).toEqual({
      name: "Ann",
      phone: "+1 555 0100",
      guests: "4",
      date: "2026-10-12",
      preorder: true,
    });
  });
});
