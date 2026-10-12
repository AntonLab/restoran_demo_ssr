import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSessionRecord, findSession } from "@/server/auth/session-store";
import { hashToken } from "@/server/auth/tokens";
import type { MailMessage } from "@/server/mail/types";
import { PasswordResetToken } from "@/server/models/password-reset-token";
import { User } from "@/server/models/user";
import { isResetTokenValid, requestPasswordReset, resetPassword } from "@/server/password-reset";
import { createRateLimiter } from "@/server/rate-limit";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(async () => {
  await startTestDb();
  await Promise.all([User.init(), PasswordResetToken.init()]);
});
afterAll(stopTestDb);
beforeEach(clearTestDb);

const ctx = (limit = 5) => ({
  ip: "ip",
  baseUrl: "http://app.test",
  limiter: createRateLimiter({ limit, windowMs: 3_600_000 }),
});
const mkUser = async () =>
  User.create({
    email: "ann@example.com",
    passwordHash: await hashPassword("oldpass12"),
    name: "Ann",
    phone: "5551234",
  });
const tokenOf = (mail: MailMessage | null) =>
  new URL(mail!.text.match(/https?:\/\/\S+/)![0]).searchParams.get("token")!;
const request = async (email = "ann@example.com") => {
  const r = await requestPasswordReset({ email }, ctx());
  return r.ok ? r.mail : null;
};

test("a known email gets a mail with a link; only the hash is stored", async () => {
  await mkUser();
  const mail = await request("Ann@Example.com");
  expect(mail).toMatchObject({ to: "ann@example.com" });
  expect(mail!.text).toContain("http://app.test/reset-password?token=");
  const token = tokenOf(mail);
  expect(await PasswordResetToken.countDocuments({ tokenHash: hashToken(token) })).toBe(1);
  expect(await PasswordResetToken.countDocuments({ tokenHash: token })).toBe(0);
});
test("an unknown email answers ok with no mail and no token", async () => {
  expect(await requestPasswordReset({ email: "no@example.com" }, ctx())).toEqual({
    ok: true,
    mail: null,
  });
  expect(await PasswordResetToken.countDocuments()).toBe(0);
});
test("a new request invalidates the previous link", async () => {
  await mkUser();
  const first = tokenOf(await request());
  const second = tokenOf(await request());
  expect(await isResetTokenValid(first)).toBe(false);
  expect(await isResetTokenValid(second)).toBe(true);
  expect(await PasswordResetToken.countDocuments()).toBe(1);
});
test("reset changes the password, ends every Session and is single use", async () => {
  const user = await mkUser();
  const { token: sid } = await createSessionRecord(String(user._id));
  const token = tokenOf(await request());
  expect(await resetPassword({ token, password: "newpass123" })).toEqual({ ok: true });
  expect(await verifyPassword("newpass123", (await User.findById(user._id))!.passwordHash)).toBe(
    true,
  );
  expect(await findSession(sid)).toBeNull();
  expect(await isResetTokenValid(token)).toBe(false);
  expect(await resetPassword({ token, password: "another123" })).toEqual({
    ok: false,
    error: "This link is invalid or expired.",
  });
});
test("two simultaneous uses of one link: exactly one wins", async () => {
  await mkUser();
  const token = tokenOf(await request());
  const results = await Promise.all([
    resetPassword({ token, password: "newpass123" }),
    resetPassword({ token, password: "newpass456" }),
  ]);
  expect(results.filter((r) => r.ok)).toHaveLength(1);
});
test("an expired link is refused and the password stays", async () => {
  const user = await mkUser();
  const token = tokenOf(await request());
  await PasswordResetToken.updateOne({}, { expiresAt: new Date(Date.now() - 1000) });
  expect(await isResetTokenValid(token)).toBe(false);
  expect((await resetPassword({ token, password: "newpass123" })).ok).toBe(false);
  expect(await verifyPassword("oldpass12", (await User.findById(user._id))!.passwordHash)).toBe(
    true,
  );
});
test("a weak new password is a field error and does not burn the link", async () => {
  await mkUser();
  const token = tokenOf(await request());
  expect(await resetPassword({ token, password: "short" })).toMatchObject({
    ok: false,
    fieldErrors: { password: ["Use 8 to 72 characters."] },
  });
  expect(await isResetTokenValid(token)).toBe(true);
});
test.each([undefined, "", "garbage", 42])("token %j is not valid", async (token) => {
  expect(await isResetTokenValid(token)).toBe(false);
});
test("request validates the email and is limited to 5 per hour", async () => {
  expect(await requestPasswordReset({ email: "x" }, ctx())).toMatchObject({
    ok: false,
    fieldErrors: { email: ["Enter a valid email."] },
  });
  const c = ctx(5);
  for (let i = 0; i < 5; i++) await requestPasswordReset({ email: "a@b.io" }, c);
  expect(await requestPasswordReset({ email: "a@b.io" }, c)).toMatchObject({
    ok: false,
    error: expect.stringMatching(/^Too many attempts\. Try again in \d+ minutes?\.$/),
  });
});
