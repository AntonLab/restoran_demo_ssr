import { mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcrypt";
import sharp from "sharp";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { Category } from "@/server/models/category";
import { Dish } from "@/server/models/dish";
import { Review } from "@/server/models/review";
import { Settings } from "@/server/models/settings";
import { User } from "@/server/models/user";
import { SEED_DISHES, SEED_REVIEWS } from "@/server/seed/catalog";
import { runSeed } from "@/server/seed/seed";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

let imagesDir: string;
let uploadsDir: string;
beforeAll(async () => {
  await startTestDb();
  imagesDir = await mkdtemp(path.join(tmpdir(), "seed-img-"));
  const jpeg = await sharp({
    create: { width: 1000, height: 700, channels: 3, background: "#363" },
  })
    .jpeg()
    .toBuffer();
  for (const d of SEED_DISHES) await writeFile(path.join(imagesDir, d.image), jpeg);
});
afterAll(stopTestDb);
beforeEach(async () => {
  await clearTestDb();
  uploadsDir = await mkdtemp(path.join(tmpdir(), "seed-up-"));
});

const admin = { adminEmail: "Admin@Example.com", adminPassword: "s3cret-pass" };
const opts = () => ({ imagesDir, uploadsDir, ...admin });

async function expectNothingSeeded() {
  for (const model of [Category, Dish, Review, Settings, User]) {
    expect(await model.countDocuments(), model.modelName).toBe(0);
  }
}

describe("runSeed", () => {
  test("creates Settings, 12 Categories, Dishes with images, approved Reviews and the Admin", async () => {
    await runSeed(opts());
    expect((await Settings.findOne().lean())?.name).toBe("Verde Kitchen");
    expect(await Category.countDocuments()).toBe(12);
    expect(await Dish.countDocuments()).toBe(SEED_DISHES.length);
    expect(await Review.countDocuments({ status: "approved" })).toBe(12);
    const user = await User.findOne({ role: "admin" }).lean();
    expect(user?.email).toBe("admin@example.com");
    expect(user?.passwordHash).not.toBe(admin.adminPassword);
    expect(await bcrypt.compare(admin.adminPassword, user?.passwordHash ?? "")).toBe(true);
    expect(await readdir(uploadsDir)).toHaveLength(SEED_DISHES.length * 2);
  });
  test("a second run changes nothing", async () => {
    const first = await runSeed(opts());
    const second = await runSeed(opts());
    expect(second).toEqual({ ...first, admin: "exists" });
    expect(await Dish.countDocuments()).toBe(SEED_DISHES.length);
    expect(await Review.countDocuments()).toBe(12);
    expect(await Settings.countDocuments()).toBe(1);
    expect(await User.countDocuments()).toBe(1);
    expect(await readdir(uploadsDir)).toHaveLength(SEED_DISHES.length * 2);
  });
  test("keeps an Admin's edits to existing Dishes and Settings", async () => {
    await runSeed(opts());
    await Dish.updateOne({ name: SEED_DISHES[0].name }, { priceCents: 1 });
    await Settings.updateOne({}, { name: "Renamed" });
    await runSeed(opts());
    expect((await Dish.findOne({ name: SEED_DISHES[0].name }).lean())?.priceCents).toBe(1);
    expect((await Settings.findOne().lean())?.name).toBe("Renamed");
  });
  test("leaves an existing Admin's password hash untouched", async () => {
    await runSeed(opts());
    const before = (await User.findOne({ role: "admin" }).lean())?.passwordHash;
    expect(await runSeed({ ...opts(), adminPassword: "another-pass" })).toMatchObject({
      admin: "exists",
    });
    expect((await User.findOne({ role: "admin" }).lean())?.passwordHash).toBe(before);
  });
  test("matches Reviews by text, so a re-seed adds no duplicates", async () => {
    await runSeed(opts());
    await Review.deleteOne({ text: SEED_REVIEWS[0].text });
    await runSeed(opts());
    expect(await Review.countDocuments()).toBe(SEED_REVIEWS.length);
    expect(await Review.countDocuments({ text: SEED_REVIEWS[0].text })).toBe(1);
  });
  test("removes the written images and rethrows when creating a Dish fails", async () => {
    const failure = new Error("insert failed");
    const create = vi.spyOn(Dish, "create").mockRejectedValueOnce(failure as never);
    await expect(runSeed(opts())).rejects.toBe(failure);
    create.mockRestore();
    expect(await readdir(uploadsDir)).toHaveLength(0);
  });
  test.each([{ adminEmail: undefined }, { adminPassword: "" }])(
    "fails before writing without admin env %j",
    async (missing) => {
      await expect(runSeed({ ...opts(), ...missing })).rejects.toThrow(
        /ADMIN_EMAIL|ADMIN_PASSWORD/,
      );
      await expectNothingSeeded();
    },
  );
  test("fails before writing when a seed image is missing and names the file", async () => {
    const empty = await mkdtemp(path.join(tmpdir(), "seed-empty-"));
    await expect(runSeed({ ...opts(), imagesDir: empty })).rejects.toThrow(SEED_DISHES[0].image);
    await expectNothingSeeded();
    expect(await readdir(uploadsDir)).toHaveLength(0);
  });
});
