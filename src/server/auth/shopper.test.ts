import { describe, expect, test } from "vitest";
import {
  cartCookieOptions,
  newCid,
  parseCid,
  resolveShopper,
  toOrderContext,
} from "@/server/auth/shopper";
import type { SessionInfo } from "@/server/auth/session-store";

const session = (role: "user" | "admin"): SessionInfo => ({
  sessionId: "s",
  user: { id: "u1", email: "a@b.c", name: "A", phone: null, role },
});
const CID = "3f2b8c1e-9d4a-4e6b-8a1c-0d5e7f9a2b34";

describe("parseCid", () => {
  test("accepts a UUID and a generated cid", () => {
    expect(parseCid(CID)).toBe(CID);
    expect(parseCid(newCid())).not.toBeNull();
  });
  test.each([
    undefined,
    null,
    "",
    "abc",
    "guest:x",
    "../../etc",
    `${CID}x`,
    CID.toUpperCase() + " ",
  ])("treats %j as absent", (raw) => expect(parseCid(raw)).toBeNull());
});

describe("resolveShopper", () => {
  test("a Guest with a valid cid owns guest:<cid>", () => {
    expect(resolveShopper(null, CID)).toEqual({
      role: "guest",
      userId: null,
      ownerKey: `guest:${CID}`,
    });
  });
  test("a Guest with no or a forged cid has no Cart key", () => {
    expect(resolveShopper(null, undefined)?.ownerKey).toBeNull();
    expect(resolveShopper(null, "guest:evil")?.ownerKey).toBeNull();
  });
  test("a User owns user:<id> whatever the cid", () => {
    expect(resolveShopper(session("user"), CID)).toEqual({
      role: "user",
      userId: "u1",
      ownerKey: "user:u1",
    });
  });
  test("an Admin has no shopper", () => {
    expect(resolveShopper(session("admin"), CID)).toBeNull();
  });
});

test("cartCookieOptions", () => {
  expect(cartCookieOptions(true)).toEqual({
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 2_592_000,
  });
  expect(cartCookieOptions(false).secure).toBe(false);
});

test("toOrderContext carries role, ids and ip", () => {
  const shopper = resolveShopper(session("user"), undefined)!;
  expect(toOrderContext(shopper, "1.2.3.4")).toEqual({
    ownerKey: "user:u1",
    userId: "u1",
    role: "user",
    ip: "1.2.3.4",
  });
});
