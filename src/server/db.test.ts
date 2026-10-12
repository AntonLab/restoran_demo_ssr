import mongoose from "mongoose";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { connectDb } from "@/server/db";

const globalForDb = globalThis as typeof globalThis & {
  mongooseConnecting?: Promise<typeof mongoose>;
};

beforeEach(() => {
  globalForDb.mongooseConnecting = undefined;
});
afterEach(() => {
  vi.restoreAllMocks();
  globalForDb.mongooseConnecting = undefined;
});

test("after a failed connect the next call tries again", async () => {
  const connect = vi
    .spyOn(mongoose, "connect")
    .mockRejectedValueOnce(new Error("refused"))
    .mockResolvedValueOnce(mongoose);
  await expect(connectDb()).rejects.toThrow("refused");
  await expect(connectDb()).resolves.toBe(mongoose);
  expect(connect).toHaveBeenCalledTimes(2);
});

test("concurrent calls share one connect", async () => {
  const connect = vi.spyOn(mongoose, "connect").mockResolvedValue(mongoose);
  await Promise.all([connectDb(), connectDb()]);
  expect(connect).toHaveBeenCalledTimes(1);
});
