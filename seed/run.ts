import path from "node:path";
import mongoose from "mongoose";
import { getEnv } from "@/server/env";
import { runSeed } from "@/server/seed/seed";

try {
  const env = getEnv();
  const totals = await runSeed({
    imagesDir: path.resolve("seed/images"),
    adminEmail: env.ADMIN_EMAIL,
    adminPassword: env.ADMIN_PASSWORD,
    log: console.log,
  });
  console.log(totals);
} catch (error) {
  process.exitCode = 1;
  console.error(error instanceof Error ? error.message : error);
} finally {
  await mongoose.disconnect();
}
