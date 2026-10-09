import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

test("hash verifies only the right password", async () => {
  const hash = await hashPassword("correct horse");
  expect(hash).not.toContain("correct horse");
  expect(await verifyPassword("correct horse", hash)).toBe(true);
  expect(await verifyPassword("wrong", hash)).toBe(false);
});
test("a missing hash never verifies", async () => {
  expect(await verifyPassword("anything", null)).toBe(false);
});
