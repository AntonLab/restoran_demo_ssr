import { expect, test } from "vitest";
import { createRateLimiter } from "@/server/rate-limit";

const HOUR = 3_600_000;

test("allows 5 per hour per key, refuses the 6th", () => {
  let t = 0;
  const limiter = createRateLimiter({ limit: 5, windowMs: HOUR, now: () => t });
  for (let i = 0; i < 5; i++) expect(limiter.hit("1.1.1.1").ok).toBe(true);
  const sixth = limiter.hit("1.1.1.1");
  expect(sixth.ok).toBe(false);
  expect(sixth.retryAfterMs).toBeGreaterThan(0);
  expect(limiter.hit("2.2.2.2").ok).toBe(true);
});

test("frees a slot when the oldest hit leaves the window", () => {
  let t = 0;
  const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
  limiter.hit("k");
  t = 500;
  limiter.hit("k");
  expect(limiter.hit("k").ok).toBe(false);
  t = 1001;
  expect(limiter.hit("k").ok).toBe(true);
});

test("refused calls are not counted", () => {
  let t = 0;
  const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => t });
  limiter.hit("k");
  for (let i = 0; i < 10; i++) limiter.hit("k");
  t = 1001;
  expect(limiter.hit("k").ok).toBe(true);
});
