import { describe, expect, test } from "vitest";
import { cancelFailureText, formatItems, hasOrderFilters, pageHrefs } from "@/lib/order-view";

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

describe("pageHrefs", () => {
  test("the first page has only next, and keeps the filters", () => {
    expect(pageHrefs({ ...none, dish: "tea" }, 3)).toEqual({
      prev: null,
      next: "/account/orders?dish=tea&page=2",
    });
  });
  test("a middle page links both ways and page 1 has a clean URL", () => {
    expect(pageHrefs({ ...none, page: 2 }, 3)).toEqual({
      prev: "/account/orders",
      next: "/account/orders?page=3",
    });
  });
  test("a page past the last links back to the last page, with no next", () => {
    expect(pageHrefs({ ...none, page: 9 }, 3)).toEqual({
      prev: "/account/orders?page=3",
      next: null,
    });
  });
});

describe("cancelFailureText", () => {
  test("adds the fresh status when the server sent one", () => {
    expect(cancelFailureText("This order can no longer be cancelled", "accepted")).toBe(
      "This order can no longer be cancelled. Current status: Accepted.",
    );
  });
  test("returns the server text unchanged without a status", () => {
    expect(cancelFailureText("Order not found.")).toBe("Order not found.");
  });
  test("does not double a trailing period", () => {
    expect(cancelFailureText("Order not found.", "cancelled")).toBe(
      "Order not found. Current status: Cancelled.",
    );
  });
});
