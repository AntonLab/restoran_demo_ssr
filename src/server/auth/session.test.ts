import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { createSession, getSession, revokeSession } from "@/server/auth/session";
import { SESSION_COOKIE, SESSION_TTL_MS } from "@/server/auth/session-store";
import { hashToken } from "@/server/auth/tokens";
import { Session } from "@/server/models/session";
import { User } from "@/server/models/user";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

const store = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => store }));

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  vi.clearAllMocks();
  await clearTestDb();
});
afterEach(() => vi.unstubAllEnvs());

const mkUser = () =>
  User.create({ email: "a@b.c", passwordHash: "h", name: "Ann", phone: "5551234" });

describe("createSession", () => {
  test("stores the hash and sets an httpOnly, lax cookie that expires with the Session", async () => {
    const u = await mkUser();
    const before = Date.now();
    await createSession(String(u._id));
    const [name, token, options] = store.set.mock.calls[0];
    expect(name).toBe(SESSION_COOKIE);
    expect(await Session.countDocuments({ tokenHash: hashToken(token) })).toBe(1);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + SESSION_TTL_MS);
  });
  test("is secure in production only", async () => {
    const u = await mkUser();
    vi.stubEnv("NODE_ENV", "production");
    await createSession(String(u._id));
    vi.stubEnv("NODE_ENV", "development");
    await createSession(String(u._id));
    expect(store.set.mock.calls[0][2].secure).toBe(true);
    expect(store.set.mock.calls[1][2].secure).toBe(false);
  });
});

describe("getSession", () => {
  test("returns the user for a valid token", async () => {
    const u = await mkUser();
    await createSession(String(u._id));
    store.get.mockReturnValue({ value: store.set.mock.calls[0][1] });
    expect((await getSession())?.user.id).toBe(String(u._id));
  });
  test("is null for an expired token", async () => {
    const u = await mkUser();
    await createSession(String(u._id));
    await Session.updateOne({}, { expiresAt: new Date(Date.now() - 1000) });
    store.get.mockReturnValue({ value: store.set.mock.calls[0][1] });
    expect(await getSession()).toBeNull();
  });
  test.each([{ value: "unknown-token" }, undefined])("is null for %j", async (cookie) => {
    store.get.mockReturnValue(cookie);
    expect(await getSession()).toBeNull();
  });
});

describe("revokeSession", () => {
  test("deletes the record and the cookie", async () => {
    const u = await mkUser();
    await createSession(String(u._id));
    store.get.mockReturnValue({ value: store.set.mock.calls[0][1] });
    await revokeSession();
    expect(await Session.countDocuments()).toBe(0);
    expect(store.delete).toHaveBeenCalledWith(SESSION_COOKIE);
  });
});
