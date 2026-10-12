import { describe, expect, test } from "vitest";
import { guestCidOf, type OrderContext } from "@/server/orders";

const CID = "8f14e45f-ceea-467a-9575-6e1bc1a4f2b1";
const ctx = (patch: Partial<OrderContext>): OrderContext => ({
  ownerKey: null,
  userId: null,
  role: "guest",
  ip: "203.0.113.7",
  ...patch,
});

describe("guestCidOf", () => {
  test("returns the uuid from a guest owner key", () => {
    expect(guestCidOf(ctx({ ownerKey: `guest:${CID}` }))).toBe(CID);
  });

  test("returns null for a user, even with a guest owner key", () => {
    expect(guestCidOf(ctx({ role: "user", userId: "u1", ownerKey: `guest:${CID}` }))).toBeNull();
  });

  test("returns null for an admin, even with a guest owner key", () => {
    expect(guestCidOf(ctx({ role: "admin", ownerKey: `guest:${CID}` }))).toBeNull();
  });

  test("returns null without an owner key", () => {
    expect(guestCidOf(ctx({ ownerKey: null }))).toBeNull();
  });

  test("returns null for a user owner key", () => {
    expect(guestCidOf(ctx({ ownerKey: "user:507f1f77bcf86cd799439011" }))).toBeNull();
  });
});
