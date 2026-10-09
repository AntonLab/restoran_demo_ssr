import { execFileSync } from "node:child_process";
import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, expect, test } from "vitest";
import { SEED_DISHES } from "@/server/seed/catalog";
import { Dish } from "@/server/models/dish";
import { startTestDb, stopTestDb } from "@/server/test/db";

let uri: string;
beforeAll(async () => {
  uri = await startTestDb();
});
afterAll(stopTestDb);

test("npm run seed twice leaves one copy of everything and serves real images", async () => {
  const uploads = await mkdtemp(path.join(tmpdir(), "e2e-up-"));
  const env = {
    ...process.env,
    MONGODB_URI: uri,
    ADMIN_EMAIL: "admin@example.com",
    ADMIN_PASSWORD: "s3cret-pass",
    UPLOADS_DIR: uploads,
  };
  const seed = () =>
    execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "--import",
        "./scripts/register-alias.mjs",
        "seed/run.ts",
      ],
      { env, encoding: "utf8" },
    );
  seed();
  seed();
  expect(await Dish.countDocuments()).toBe(SEED_DISHES.length);
  expect(await readdir(uploads)).toHaveLength(SEED_DISHES.length * 2);
}, 120_000);
