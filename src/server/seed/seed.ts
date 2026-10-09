import { access, readFile, rm } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcrypt";
import type { Types } from "mongoose";
import { connectDb } from "@/server/db";
import { getUploadsDir, processImage } from "@/server/images";
import { Category } from "@/server/models/category";
import { Dish } from "@/server/models/dish";
import { Review } from "@/server/models/review";
import { Settings } from "@/server/models/settings";
import { User } from "@/server/models/user";
import { CATEGORY_NAMES, SEED_DISHES, SEED_REVIEWS } from "@/server/seed/catalog";
import { DEFAULT_SETTINGS } from "@/server/settings-defaults";

export type SeedOptions = {
  imagesDir: string;
  uploadsDir?: string;
  adminEmail?: string;
  adminPassword?: string;
  log?: (message: string) => void;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Everything that can fail is checked before the first write, so a bad run leaves no half-seeded data.
async function validate(opts: SeedOptions): Promise<{ email: string; password: string }> {
  const { adminEmail, adminPassword } = opts;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to seed the Admin");
  }
  for (const dish of SEED_DISHES) {
    try {
      await access(path.join(opts.imagesDir, dish.image));
    } catch {
      throw new Error(`Seed image missing: ${dish.image} (looked in ${opts.imagesDir})`);
    }
  }
  return { email: adminEmail.toLowerCase(), password: adminPassword };
}

export async function runSeed(opts: SeedOptions): Promise<{
  categories: number;
  dishes: number;
  reviews: number;
  admin: "created" | "exists";
}> {
  const { email, password } = await validate(opts);
  const log = opts.log ?? (() => {});
  const uploadsDir = opts.uploadsDir ?? getUploadsDir();
  await connectDb();

  if (!(await Settings.exists({}))) {
    await Settings.create(DEFAULT_SETTINGS);
    log("Settings created");
  }

  const categoryIds = new Map<string, Types.ObjectId>();
  for (const [index, name] of CATEGORY_NAMES.entries()) {
    const existing = await Category.findOne({ name });
    const category = existing ?? (await Category.create({ name, order: index + 1 }));
    categoryIds.set(name, category._id);
    if (!existing) log(`Category created: ${name}`);
  }

  const positions = new Map<string, number>();
  for (const seed of SEED_DISHES) {
    const position = (positions.get(seed.category) ?? 0) + 1;
    positions.set(seed.category, position);
    if (await Dish.exists({ name: seed.name })) continue;
    const image = await processImage(
      await readFile(path.join(opts.imagesDir, seed.image)),
      uploadsDir,
    );
    try {
      await Dish.create({
        name: seed.name,
        shortDescription: seed.shortDescription,
        fullDescription: seed.fullDescription,
        weight: seed.weight,
        ingredients: seed.ingredients,
        priceCents: seed.priceCents,
        categoryId: categoryIds.get(seed.category),
        isChefChoice: seed.isChefChoice ?? false,
        inStock: seed.inStock ?? true,
        favoritesCount: seed.favoritesCount,
        order: position,
        image,
      });
    } catch (error) {
      // processImage already wrote the files; a failed insert would orphan them.
      await Promise.all(
        Object.values(image).map((name) => rm(path.join(uploadsDir, name), { force: true })),
      );
      throw error;
    }
    log(`Dish created: ${seed.name}`);
  }

  const now = Date.now();
  for (const [index, seed] of SEED_REVIEWS.entries()) {
    if (await Review.exists({ text: seed.text })) continue;
    await Review.create({
      ...seed,
      status: "approved",
      createdAt: new Date(now - ((index + 1) * 60 * DAY_MS) / SEED_REVIEWS.length),
    });
    log("Review created");
  }

  let admin: "created" | "exists" = "exists";
  if (!(await User.exists({ email }))) {
    await User.create({
      email,
      name: "Admin",
      role: "admin",
      passwordHash: await bcrypt.hash(password, 10),
    });
    admin = "created";
    log(`Admin created: ${email}`);
  }

  return {
    categories: await Category.countDocuments(),
    dishes: await Dish.countDocuments(),
    reviews: await Review.countDocuments(),
    admin,
  };
}
