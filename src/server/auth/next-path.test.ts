import { expect, test } from "vitest";
import { postLoginPath, safeNext } from "@/server/auth/next-path";

test.each([
  [undefined, "user", "/account"],
  ["", "admin", "/admin"],
  ["/menu?q=a", "user", "/menu?q=a"],
  ["//evil.com", "admin", "/"],
  ["https://evil.com", "user", "/"],
  ["/login", "user", "/account"],
  ["/login?next=/login", "admin", "/admin"],
  ["/register", "user", "/account"],
  ["/register?x=1", "admin", "/admin"],
  ["/forgot-password", "user", "/account"],
  ["/forgot-password?a=b", "user", "/account"],
  ["/reset-password", "admin", "/admin"],
  ["/reset-password?token=t", "user", "/account"],
  ["/login/extra", "user", "/account"],
  ["/login#top", "user", "/account"],
  ["/loginx", "user", "/loginx"],
])("postLoginPath(%j, %s) is %s", (next, role, expected) => {
  expect(postLoginPath(next, role as "user" | "admin")).toBe(expected);
});

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
