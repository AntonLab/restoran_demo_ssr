import { expect, test } from "vitest";
import { formatDateTime, formatPrice, telHref } from "@/lib/format";

test.each([
  [1250, "$12.50"],
  [5, "$0.05"],
  [100000, "$1,000.00"],
  [0, "$0.00"],
])("formatPrice(%i) = %s", (cents, text) => {
  expect(formatPrice(cents)).toBe(text);
});

test.each([
  ["+1 555 010 2030", "tel:+15550102030"],
  ["(555) 010-2030", "tel:5550102030"],
  ["", "tel:"],
])("telHref(%j) = %s", (phone, href) => {
  expect(telHref(phone)).toBe(href);
});

test("formatDateTime renders the venue timezone and falls back to UTC", () => {
  const at = new Date("2026-10-12T18:30:00Z");
  expect(formatDateTime(at, "UTC")).toMatch(/Oct 12, 2026.*18:30/);
  expect(formatDateTime(at, "America/New_York")).toMatch(/Oct 12, 2026.*14:30/);
  expect(formatDateTime(at, "Not/AZone")).toMatch(/Oct 12, 2026.*18:30/);
});
