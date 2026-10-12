import { expect, test } from "vitest";
import { parseOrderNumber } from "@/lib/order-number";

test.each([
  ["1", 1],
  ["42", 42],
  ["123456789", 123456789],
])("accepts %s", (raw, expected) => {
  expect(parseOrderNumber(raw)).toBe(expected);
});

test.each([
  undefined,
  "",
  " 5",
  "abc",
  "-1",
  "0",
  "007",
  "1.5",
  "1e3",
  "+4",
  "12345678901234567890",
  ["1", "2"],
  ["1"],
])("rejects %j", (raw) => {
  expect(parseOrderNumber(raw)).toBeNull();
});
