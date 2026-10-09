import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import { changeEmail, changePassword, updateContacts } from "@/server/account-settings";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSessionRecord, findSession } from "@/server/auth/session-store";
import { User } from "@/server/models/user";
import { createRateLimiter } from "@/server/rate-limit";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(async () => {
  await startTestDb();
  await User.init();
});
afterAll(stopTestDb);
beforeEach(clearTestDb);

const lim = () => createRateLimiter({ limit: 10, windowMs: 900_000 });
const mk = async (email: string) =>
  String(
    (
      await User.create({
        email,
        passwordHash: await hashPassword("oldpass12"),
        name: "Ann",
        phone: "5551234",
      })
    )._id,
  );
const wrongPassword = {
  ok: false,
  fieldErrors: { currentPassword: ["Current password is wrong"] },
};

test("updateContacts saves name and normalized phone without a password", async () => {
  const id = await mk("a@b.io");
  expect(await updateContacts(id, { name: " Bo ", phone: "+1 555 000 1111" })).toEqual({
    ok: true,
  });
  expect(await User.findById(id).lean()).toMatchObject({ name: "Bo", phone: "+15550001111" });
  expect(await updateContacts(id, { name: "", phone: "1" })).toMatchObject({ ok: false });
});
test("changeEmail needs the current password and a free address", async () => {
  const id = await mk("a@b.io");
  await mk("taken@b.io");
  expect(
    await changeEmail(id, { email: "new@b.io", currentPassword: "nope" }, lim()),
  ).toMatchObject(wrongPassword);
  expect(
    await changeEmail(id, { email: "TAKEN@b.io", currentPassword: "oldpass12" }, lim()),
  ).toMatchObject({
    ok: false,
    fieldErrors: { email: ["Email already registered"] },
  });
  expect((await User.findById(id))!.email).toBe("a@b.io");
  expect(
    await changeEmail(id, { email: " New@B.io ", currentPassword: "oldpass12" }, lim()),
  ).toEqual({ ok: true });
  expect((await User.findById(id))!.email).toBe("new@b.io");
});
test("changePassword checks the current one and keeps only the current Session", async () => {
  const id = await mk("a@b.io");
  const current = await createSessionRecord(id);
  const other = await createSessionRecord(id);
  const sessionId = (await findSession(current.token))!.sessionId;
  expect(
    await changePassword(
      id,
      sessionId,
      { currentPassword: "nope", newPassword: "newpass123" },
      lim(),
    ),
  ).toMatchObject(wrongPassword);
  expect(
    await changePassword(
      id,
      sessionId,
      { currentPassword: "oldpass12", newPassword: "short" },
      lim(),
    ),
  ).toMatchObject({
    ok: false,
    fieldErrors: { newPassword: ["Use 8 to 72 characters."] },
  });
  expect(await findSession(other.token)).not.toBeNull();
  expect(
    await changePassword(
      id,
      sessionId,
      { currentPassword: "oldpass12", newPassword: "newpass123" },
      lim(),
    ),
  ).toEqual({ ok: true });
  expect(await verifyPassword("newpass123", (await User.findById(id))!.passwordHash)).toBe(true);
  expect(await findSession(current.token)).not.toBeNull();
  expect(await findSession(other.token)).toBeNull();
});
test("the 11th attempt is refused, shared by both actions, per user", async () => {
  const id = await mk("a@b.io");
  const limiter = lim();
  for (let i = 0; i < 5; i++)
    await changeEmail(id, { email: "x@b.io", currentPassword: "bad" }, limiter);
  for (let i = 0; i < 5; i++) {
    await changePassword(id, "s", { currentPassword: "bad", newPassword: "newpass123" }, limiter);
  }
  const eleventh = await changeEmail(
    id,
    { email: "x@b.io", currentPassword: "oldpass12" },
    limiter,
  );
  expect(eleventh).toMatchObject({ ok: false, error: expect.stringMatching(/^Too many attempts/) });
  const stranger = await mk("c@b.io");
  expect(
    (await changeEmail(stranger, { email: "z@b.io", currentPassword: "oldpass12" }, limiter)).ok,
  ).toBe(true);
});
