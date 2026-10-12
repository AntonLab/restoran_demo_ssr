import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import {
  createSessionRecord,
  deleteSessionByToken,
  findSession,
  revokeAllSessions,
  SESSION_TTL_MS,
  sessionCookieOptions,
} from "@/server/auth/session-store";
import { hashToken } from "@/server/auth/tokens";
import { Session } from "@/server/models/session";
import { User } from "@/server/models/user";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

const mkUser = (email = "a@b.c") =>
  User.create({ email, passwordHash: "h", name: "Ann", phone: "5551234" });

test("stores only the hash and reads the Session back with the User", async () => {
  const u = await mkUser();
  const { token, expiresAt } = await createSessionRecord(String(u._id), 1_000);
  expect(expiresAt.getTime()).toBe(1_000 + SESSION_TTL_MS);
  expect(await Session.countDocuments({ tokenHash: hashToken(token) })).toBe(1);
  expect(await Session.countDocuments({ tokenHash: token })).toBe(0);
  const info = await findSession(token, 2_000);
  expect(info?.user).toEqual({
    id: String(u._id),
    email: "a@b.c",
    name: "Ann",
    phone: "5551234",
    role: "user",
  });
});
test("ignores an expired Session even before the TTL monitor removes it", async () => {
  const u = await mkUser();
  const { token } = await createSessionRecord(String(u._id), 1_000);
  expect(await findSession(token, 1_000 + SESSION_TTL_MS)).toBeNull();
  expect(await findSession(token, 1_000 + SESSION_TTL_MS - 1)).not.toBeNull();
});
test.each([undefined, "", "unknown"])("no Session for token %j", async (token) => {
  expect(await findSession(token)).toBeNull();
});
test("a Session whose User was deleted is null", async () => {
  const u = await mkUser();
  const { token } = await createSessionRecord(String(u._id));
  await User.deleteOne({ _id: u._id });
  expect(await findSession(token)).toBeNull();
});
test("deleteSessionByToken removes one Session", async () => {
  const u = await mkUser();
  const a = await createSessionRecord(String(u._id));
  const b = await createSessionRecord(String(u._id));
  await deleteSessionByToken(a.token);
  expect(await findSession(a.token)).toBeNull();
  expect(await findSession(b.token)).not.toBeNull();
});
test("revokeAllSessions keeps only the excepted Session and other users", async () => {
  const u = await mkUser();
  const other = await mkUser("o@b.c");
  const a = await createSessionRecord(String(u._id));
  const b = await createSessionRecord(String(u._id));
  const o = await createSessionRecord(String(other._id));
  const keep = (await findSession(b.token))!.sessionId;
  await revokeAllSessions(String(u._id), { except: keep });
  expect(await findSession(a.token)).toBeNull();
  expect(await findSession(b.token)).not.toBeNull();
  expect(await findSession(o.token)).not.toBeNull();
  await revokeAllSessions(String(u._id));
  expect(await findSession(b.token)).toBeNull();
});
test("cookie options are httpOnly, lax, path / and secure on demand", () => {
  const expires = new Date(5);
  expect(sessionCookieOptions(true, expires)).toEqual({
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    expires,
  });
  expect(sessionCookieOptions(false, expires).secure).toBe(false);
});
