import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { authenticate, registerUser } from "@/server/accounts";
import { hashPassword } from "@/server/auth/password";
import { User } from "@/server/models/user";
import { createRateLimiter } from "@/server/rate-limit";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(async () => {
  await startTestDb();
  await User.init();
});
afterAll(stopTestDb);
beforeEach(clearTestDb);

const reg = createRateLimiter.bind(null, { limit: 5, windowMs: 3_600_000 });
const log = createRateLimiter.bind(null, { limit: 10, windowMs: 900_000 });
const form = {
  email: " Ann@Example.com ",
  password: "12345678",
  name: "Ann",
  phone: "+1 555 123 4567",
};

describe("registerUser", () => {
  test("creates a user-role User with a hashed password, lower-case email and normalized phone", async () => {
    const result = await registerUser(form, "1.1.1.1", reg());
    expect(result.ok).toBe(true);
    expect(result).toMatchObject({ ok: true, phone: "+15551234567" });
    const saved = await User.findOne().lean();
    expect(saved).toMatchObject({
      email: "ann@example.com",
      role: "user",
      name: "Ann",
      phone: "+15551234567",
    });
    expect(saved?.passwordHash).not.toBe("12345678");
  });
  test("an existing email in any case is a field error", async () => {
    await registerUser(form, "1.1.1.1", reg());
    const again = await registerUser({ ...form, email: "ANN@example.com" }, "1.1.1.1", reg());
    expect(again).toMatchObject({
      ok: false,
      fieldErrors: { email: ["Email already registered"] },
    });
  });
  test("two registrations of one email at once: one wins, none throws", async () => {
    const results = await Promise.all([
      registerUser(form, "1.1.1.1", reg()),
      registerUser(form, "1.1.1.2", reg()),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await User.countDocuments()).toBe(1);
  });
  test("invalid input reports fields and does not spend a limiter hit", async () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 3_600_000 });
    const bad = await registerUser({ ...form, password: "x" }, "ip", limiter);
    expect(bad).toMatchObject({
      ok: false,
      fieldErrors: { password: ["Use 8 to 72 characters."] },
    });
    expect((await registerUser(form, "ip", limiter)).ok).toBe(true);
  });
  test("the 6th attempt from one IP in an hour is refused", async () => {
    const limiter = reg();
    for (let i = 0; i < 5; i++) await registerUser({ ...form, email: `u${i}@x.io` }, "ip", limiter);
    const sixth = await registerUser({ ...form, email: "u6@x.io" }, "ip", limiter);
    expect(sixth).toMatchObject({
      ok: false,
      error: expect.stringMatching(/^Too many attempts\. Try again in \d+ minutes?\.$/),
    });
    expect(await User.countDocuments()).toBe(5);
  });
});

describe("authenticate", () => {
  beforeEach(async () => {
    await User.create({
      email: "ann@example.com",
      passwordHash: await hashPassword("12345678"),
      name: "Ann",
      phone: "5551234",
    });
    await User.create({
      email: "root@example.com",
      passwordHash: await hashPassword("adminpass1"),
      name: "Admin",
      role: "admin",
    });
  });
  test("returns id and role for the right password, email in any case", async () => {
    expect(
      await authenticate({ email: "ANN@example.com", password: "12345678" }, "ip", log()),
    ).toMatchObject({ ok: true, role: "user" });
    expect(
      await authenticate({ email: "root@example.com", password: "adminpass1" }, "ip", log()),
    ).toMatchObject({ ok: true, role: "admin" });
  });
  test("unknown email and wrong password give the same failure", async () => {
    const unknown = await authenticate(
      { email: "no@example.com", password: "12345678" },
      "ip",
      log(),
    );
    const wrong = await authenticate(
      { email: "ann@example.com", password: "nope-nope" },
      "ip",
      log(),
    );
    expect(unknown).toEqual({ ok: false, error: "Invalid email or password" });
    expect(wrong).toEqual(unknown);
  });
  test("the 11th attempt in 15 minutes is refused even with the right password", async () => {
    const limiter = log();
    for (let i = 0; i < 10; i++)
      await authenticate({ email: "ann@example.com", password: "bad-bad-bad" }, "ip", limiter);
    const eleventh = await authenticate(
      { email: "Ann@Example.com", password: "12345678" },
      "ip",
      limiter,
    );
    expect(eleventh).toMatchObject({
      ok: false,
      error: expect.stringMatching(/^Too many attempts/),
    });
    const other = { email: "ann@example.com", password: "12345678" };
    expect((await authenticate(other, "other-ip", limiter)).ok).toBe(true);
  });
});
