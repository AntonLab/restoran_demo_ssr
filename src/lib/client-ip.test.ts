import { expect, test } from "vitest";
import { clientIp } from "@/lib/client-ip";

const h = (v: string | null) => ({ get: () => v });

test.each([
  ["203.0.113.7", "203.0.113.7"],
  ["203.0.113.7, 10.0.0.1, 10.0.0.2", "203.0.113.7"],
  ["  198.51.100.4 , 10.0.0.1", "198.51.100.4"],
  ["", "unknown"],
  ["   ", "unknown"],
  [null, "unknown"],
])("clientIp(%j) = %s", (value, expected) => {
  expect(clientIp(h(value))).toBe(expected);
});
