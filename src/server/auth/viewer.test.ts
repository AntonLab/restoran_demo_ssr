import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import type { SessionInfo } from "@/server/auth/session-store";
import { buildViewer } from "@/server/auth/viewer";
import { Favorite } from "@/server/models/favorite";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

const session = (role: "user" | "admin", id: string): SessionInfo => ({
  sessionId: "s",
  user: { id, email: "a@b.c", name: "A", phone: null, role },
});

test("a Guest has no Favorites", async () => {
  expect(await buildViewer(null)).toEqual({ role: "guest", favoriteIds: [] });
});
test("a User gets the ids of their Favorites; an Admin gets none", async () => {
  const userId = new mongoose.Types.ObjectId();
  const dishId = new mongoose.Types.ObjectId();
  await Favorite.create({ userId, dishId });
  expect(await buildViewer(session("user", String(userId)))).toEqual({
    role: "user",
    favoriteIds: [String(dishId)],
  });
  expect(await buildViewer(session("admin", String(userId)))).toEqual({
    role: "admin",
    favoriteIds: [],
  });
});
