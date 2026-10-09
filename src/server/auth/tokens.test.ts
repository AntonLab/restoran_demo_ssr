import { expect, test } from "vitest";
import { hashToken, newToken } from "@/server/auth/tokens";

test("newToken is 43 base64url characters and unique", () => {
  const a = newToken();
  expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(newToken()).not.toBe(a);
});
test("hashToken is SHA-256 hex", () => {
  expect(hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});
