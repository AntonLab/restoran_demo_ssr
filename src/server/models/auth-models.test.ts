import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { Favorite } from "@/server/models/favorite";
import { PasswordResetToken } from "@/server/models/password-reset-token";
import { Session } from "@/server/models/session";
import { User } from "@/server/models/user";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(async () => {
  await startTestDb();
  await Promise.all([Session.init(), PasswordResetToken.init(), Favorite.init()]);
});
afterAll(stopTestDb);
beforeEach(clearTestDb);

const id = () => new mongoose.Types.ObjectId();
const user = { email: "a@b.c", passwordHash: "h", name: "Ann" };
const soon = () => new Date(Date.now() + 60_000);

describe("User.phone", () => {
  test("is required for role user", async () => {
    await expect(new User(user).validate()).rejects.toThrow(/phone/);
    await expect(new User({ ...user, phone: "" }).validate()).rejects.toThrow(/phone/);
  });
  test("is optional for admin", async () => {
    await expect(new User({ ...user, role: "admin" }).validate()).resolves.toBeUndefined();
  });
});

describe.each([
  ["Session", Session],
  ["PasswordResetToken", PasswordResetToken],
] as const)("%s", (_name, Model) => {
  test("tokenHash is unique", async () => {
    await Model.create({ tokenHash: "h", userId: id(), expiresAt: soon() });
    await expect(
      Model.create({ tokenHash: "h", userId: id(), expiresAt: soon() }),
    ).rejects.toMatchObject({ code: 11000 });
  });
  test("expiresAt has a TTL index of 0 seconds", () => {
    expect(Model.schema.indexes()).toContainEqual([
      { expiresAt: 1 },
      expect.objectContaining({ expireAfterSeconds: 0 }),
    ]);
  });
});

test("Favorite pair is unique", async () => {
  const pair = { userId: id(), dishId: id() };
  await Favorite.create(pair);
  await expect(Favorite.create(pair)).rejects.toMatchObject({ code: 11000 });
  await expect(Favorite.create({ ...pair, dishId: id() })).resolves.toBeDefined();
});
