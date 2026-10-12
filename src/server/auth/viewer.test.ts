import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import type { SessionInfo } from "@/server/auth/session-store";
import { buildViewer } from "@/server/auth/viewer";
import { Cart } from "@/server/models/cart";
import { Favorite } from "@/server/models/favorite";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(async () => {
  await startTestDb();
  await Cart.init();
});
afterAll(stopTestDb);
beforeEach(clearTestDb);

const session = (role: "user" | "admin", id: string): SessionInfo => ({
  sessionId: "s",
  user: { id, email: "a@b.c", name: "A", phone: null, role },
});

test("a Guest has no Favorites", async () => {
  expect(await buildViewer(null)).toEqual({ role: "guest", favoriteIds: [], cartQty: {} });
});
test("a User gets the ids of their Favorites; an Admin gets none", async () => {
  const userId = new mongoose.Types.ObjectId();
  const dishId = new mongoose.Types.ObjectId();
  await Favorite.create({ userId, dishId });
  expect(await buildViewer(session("user", String(userId)))).toEqual({
    role: "user",
    favoriteIds: [String(dishId)],
    cartQty: {},
  });
  expect(await buildViewer(session("admin", String(userId)))).toEqual({
    role: "admin",
    favoriteIds: [],
    cartQty: {},
  });
});

const CID = "3f2b8c1e-9d4a-4e6b-8a1c-0d5e7f9a2b34";

test("a Guest sees the Cart named by a valid cid, and nothing for a forged one", async () => {
  const dishId = String(new mongoose.Types.ObjectId());
  await Cart.create({ ownerKey: `guest:${CID}`, guest: true, items: [{ dishId, qty: 3 }] });
  expect((await buildViewer(null, CID)).cartQty).toEqual({ [dishId]: 3 });
  expect((await buildViewer(null, "guest:evil")).cartQty).toEqual({});
  expect((await buildViewer(null)).cartQty).toEqual({});
});
test("a User sees their own Cart whatever the cid; an Admin sees none", async () => {
  const userId = String(new mongoose.Types.ObjectId());
  const dishId = String(new mongoose.Types.ObjectId());
  await Cart.create({ ownerKey: `user:${userId}`, guest: false, items: [{ dishId, qty: 2 }] });
  expect((await buildViewer(session("user", userId), CID)).cartQty).toEqual({ [dishId]: 2 });
  expect((await buildViewer(session("admin", userId), CID)).cartQty).toEqual({});
});
