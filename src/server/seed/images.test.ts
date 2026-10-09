import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, test } from "vitest";
import { SEED_DISHES } from "@/server/seed/catalog";

const dir = path.resolve("seed/images");

describe("seed images", () => {
  test.each(SEED_DISHES.map((d) => d.image))(
    "%s is a JPEG wide enough for the 900 px size",
    async (file) => {
      const meta = await sharp(path.join(dir, file)).metadata();
      expect(meta.format).toBe("jpeg");
      expect(meta.width ?? 0).toBeGreaterThanOrEqual(900);
      expect((await stat(path.join(dir, file))).size).toBeLessThan(500_000);
    },
  );
  test("CREDITS.md names every file with a source URL", async () => {
    const credits = await readFile(path.join(dir, "CREDITS.md"), "utf8");
    for (const d of SEED_DISHES) expect(credits).toContain(d.image);
    expect(credits).toMatch(/https:\/\/(unsplash\.com|www\.pexels\.com)\//);
  });
});
