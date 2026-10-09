import mongoose from "mongoose";
import { getEnv } from "@/server/env";

// Cached on globalThis so dev HMR does not open a new connection per reload.
const globalForDb = globalThis as typeof globalThis & {
  mongooseConnecting?: Promise<typeof mongoose>;
};

export async function connectDb(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  mongoose.set("strictQuery", true);
  globalForDb.mongooseConnecting ??= mongoose.connect(getEnv().MONGODB_URI).catch((error) => {
    globalForDb.mongooseConnecting = undefined;
    throw error;
  });
  return globalForDb.mongooseConnecting;
}
