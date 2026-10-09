import { expect, test } from "vitest";
import { NAV_ITEMS } from "@/config/nav";
import { isNavActive } from "@/lib/nav";

test.each([
  ["/", "/", true],
  ["/menu", "/", false],
  ["/menu", "/menu", true],
  ["/menu/dish/123", "/menu", true],
  ["/menus", "/menu", false],
  ["/feedback", "/menu", false],
  ["/feedback", "/feedback", true],
])("isNavActive(%s, %s) = %s", (pathname, href, expected) => {
  expect(isNavActive(pathname, href)).toBe(expected);
});

test("nav has exactly the three public links", () => {
  expect(NAV_ITEMS.map((i) => i.href)).toEqual(["/", "/menu", "/feedback"]);
});
