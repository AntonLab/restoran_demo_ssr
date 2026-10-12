import { expect, test } from "vitest";
import { formatItems, hasOrderFilters } from "@/lib/order-view";

const none = { from: null, to: null, status: null, dish: "", page: 1 };

test("formatItems joins qty and name", () => {
  expect(
    formatItems([
      { name: "Borscht", qty: 2 },
      { name: "Tea", qty: 1 },
    ]),
  ).toBe("2× Borscht, 1× Tea");
  expect(formatItems([])).toBe("");
});

test("hasOrderFilters ignores the page and sees every other filter", () => {
  expect(hasOrderFilters({ ...none, page: 3 })).toBe(false);
  expect(hasOrderFilters({ ...none, from: "2026-10-01" })).toBe(true);
  expect(hasOrderFilters({ ...none, status: "new" })).toBe(true);
  expect(hasOrderFilters({ ...none, dish: "tea" })).toBe(true);
});
