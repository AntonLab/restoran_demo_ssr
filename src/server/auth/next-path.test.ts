import { expect, test } from "vitest";
import { safeNext } from "@/server/auth/next-path";

test.each(["/", "/account", "/menu?q=a%20b&sort=popular#top", "/menu/dish/abc"])(
  "keeps %j",
  (value) => expect(safeNext(value)).toBe(value),
);
test.each([
  "//evil.com",
  "/\\evil.com",
  "/a\\b",
  "https://evil.com",
  "javascript:alert(1)",
  "menu",
  "",
  "/\t/evil.com",
  "/\n/evil.com",
  undefined,
  null,
  ["/a", "/b"],
  42,
])("falls back to / for %j", (value) => expect(safeNext(value)).toBe("/"));
