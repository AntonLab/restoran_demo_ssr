import { describe, expect, test } from "vitest";
import {
  DEFAULT_MENU_FILTERS,
  hasActiveFilters,
  parseMenuParams,
  serializeMenuParams,
} from "@/lib/menu-params";

describe("parseMenuParams", () => {
  test("empty input gives defaults", () => {
    expect(parseMenuParams({})).toEqual(DEFAULT_MENU_FILTERS);
  });
  test("parses every key and converts dollars to cents", () => {
    expect(
      parseMenuParams({ q: " soup ", min: "5", max: "19.99", stock: "1", sort: "price-desc" }),
    ).toEqual({
      q: "soup",
      minCents: 500,
      maxCents: 1999,
      inStock: true,
      sort: "price-desc",
    });
  });
  test.each([
    [{ min: "abc" }, null],
    [{ min: "" }, null],
    [{ min: "-5" }, null],
    [{ min: "Infinity" }, null],
    [{ min: "1e307" }, null],
    [{ min: "   " }, null],
    [{ min: "0x10" }, 1600],
    [{ min: "1e2" }, 10000],
  ])("price %j gives %s cents", (sp, expected) => {
    expect(parseMenuParams(sp).minCents).toBe(expected);
  });
  test("swaps a reversed range", () => {
    const f = parseMenuParams({ min: "20", max: "10" });
    expect([f.minCents, f.maxCents]).toEqual([1000, 2000]);
  });
  test("unknown sort and repeated keys degrade safely", () => {
    expect(parseMenuParams({ sort: "random" }).sort).toBe("order");
    expect(parseMenuParams({ q: ["a", "b"] }).q).toBe("a");
    expect(parseMenuParams({ q: "x".repeat(300) }).q).toHaveLength(100);
    expect(parseMenuParams({ stock: "yes" }).inStock).toBe(false);
  });
});

describe("serializeMenuParams", () => {
  test("defaults give an empty string", () => {
    expect(serializeMenuParams(DEFAULT_MENU_FILTERS)).toBe("");
  });
  test("round-trips non-default values", () => {
    const f = { q: "a b", minCents: 1550, maxCents: null, inStock: true, sort: "popular" as const };
    const qs = serializeMenuParams(f);
    expect(qs).toContain("min=15.5");
    expect(parseMenuParams(Object.fromEntries(new URLSearchParams(qs)))).toEqual(f);
  });
});

test("hasActiveFilters ignores sort", () => {
  expect(hasActiveFilters({ ...DEFAULT_MENU_FILTERS, sort: "popular" })).toBe(false);
  expect(hasActiveFilters({ ...DEFAULT_MENU_FILTERS, inStock: true })).toBe(true);
});
