import { afterEach, expect, test, vi } from "vitest";
import { clientIp } from "@/lib/client-ip";

const h = (v: string | null) => ({ get: () => v });

afterEach(() => vi.unstubAllEnvs());

test("ignores a spoofed header when TRUST_PROXY is unset", () => {
  vi.stubEnv("TRUST_PROXY", "");
  expect(clientIp(h("6.6.6.6"))).toBe("local");
});

test.each(["0", "-1", "1.5", "x"])("TRUST_PROXY=%j is invalid and gives local", (value) => {
  vi.stubEnv("TRUST_PROXY", value);
  expect(clientIp(h("a, b"))).toBe("local");
});

test.each([
  ["1", "a, b", "b"],
  ["2", "a, b, c", "b"],
  ["2", "  a ,  b  , c", "b"],
])("TRUST_PROXY=%s with %j gives %s", (hops, header, expected) => {
  vi.stubEnv("TRUST_PROXY", hops);
  expect(clientIp(h(header))).toBe(expected);
});

test.each([
  ["3", "a, b"],
  ["1", null],
  ["1", ""],
])("TRUST_PROXY=%s with %j gives local", (hops, header) => {
  vi.stubEnv("TRUST_PROXY", hops);
  expect(clientIp(h(header))).toBe("local");
});
