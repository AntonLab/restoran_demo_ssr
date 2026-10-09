import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { beforeAll, describe, expect, test } from "vitest";
import { InvalidImageError, MAX_IMAGE_BYTES, processImage, readUpload } from "@/server/images";

let dir: string;
beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "uploads-"));
});

const make = (width: number, height: number, format: "png" | "jpeg" = "png") =>
  sharp({ create: { width, height, channels: 3, background: "#336" } })
    [format]()
    .toBuffer();

describe("processImage", () => {
  test("writes 400 px and 900 px WebP files", async () => {
    const { small, medium } = await processImage(await make(2000, 1200), dir);
    const s = await sharp(path.join(dir, small)).metadata();
    const m = await sharp(path.join(dir, medium)).metadata();
    expect([s.format, s.width]).toEqual(["webp", 400]);
    expect([m.format, m.width]).toEqual(["webp", 900]);
  });
  test("does not enlarge a small picture", async () => {
    const { medium } = await processImage(await make(300, 200, "jpeg"), dir);
    expect((await sharp(path.join(dir, medium)).metadata()).width).toBe(300);
  });
  test.each([
    ["text", Buffer.from("not an image")],
    ["empty", Buffer.alloc(0)],
    ["too big", Buffer.alloc(MAX_IMAGE_BYTES + 1)],
  ])("rejects %s input", async (_label, buf) => {
    await expect(processImage(buf, dir)).rejects.toBeInstanceOf(InvalidImageError);
  });
});

describe("readUpload", () => {
  test("round-trips a stored file", async () => {
    const { small } = await processImage(await make(500, 500), dir);
    expect((await readUpload(small, dir))?.length).toBeGreaterThan(0);
  });
  test.each(["../secret.txt", "..\\x-400.webp", "a.webp", "", "x/y-400.webp"])(
    "returns null for unsafe name %j",
    async (name) => {
      await writeFile(path.join(dir, "secret.txt"), "s");
      expect(await readUpload(name, dir)).toBeNull();
    },
  );
  test("returns null for a well-formed name that does not exist", async () => {
    const name = "00000000-0000-0000-0000-000000000000-400.webp";
    expect(await readUpload(name, dir)).toBeNull();
  });
});
