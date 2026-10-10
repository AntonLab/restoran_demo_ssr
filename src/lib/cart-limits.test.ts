import { expect, test } from "vitest";
import { clampQty, MAX_LINES, MAX_QTY } from "@/lib/cart-limits";

test("limits match the spec", () => {
  expect([MAX_QTY, MAX_LINES]).toEqual([20, 30]);
});
test.each([
  [0, 0],
  [7, 7],
  [20, 20],
  [21, 20],
  [-3, 0],
  [2.9, 2],
  [Number.NaN, 0],
  [Number.POSITIVE_INFINITY, 20],
])("clampQty(%d) = %d", (input, expected) => {
  expect(clampQty(input)).toBe(expected);
});
