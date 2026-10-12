import { expect, test } from "vitest";
import { normalizePhone } from "@/server/auth/phone";

test.each([
  ["+1 (555) 123-4567", "+15551234567"],
  ["555-123-4567", "5551234567"],
  ["  8 800 555 35 35 ", "88005553535"],
  ["+7+9", "+79"],
  ["abc", ""],
])("normalizePhone(%j) is %j", (raw, expected) => {
  expect(normalizePhone(raw)).toBe(expected);
});
