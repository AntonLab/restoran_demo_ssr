import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import { nextNumber } from "@/server/counter";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

test("counts from 1 per key", async () => {
  expect(await nextNumber("complaint")).toBe(1);
  expect(await nextNumber("complaint")).toBe(2);
  expect(await nextNumber("order")).toBe(1);
});

test("concurrent first calls get distinct numbers", async () => {
  const numbers = await Promise.all(Array.from({ length: 20 }, () => nextNumber("complaint")));
  expect(new Set(numbers).size).toBe(20);
  expect(Math.max(...numbers)).toBe(20);
});
