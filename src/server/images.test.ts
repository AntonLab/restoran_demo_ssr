import { mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { InvalidImageError, MAX_IMAGE_BYTES, processImage, readUpload } from "@/server/images";

let dir: string;
beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "uploads-"));
});

const make = (width: number, height: number, format: "png" | "jpeg" = "png") => {
  const image = sharp({ create: { width, height, channels: 3, background: "#336" } });
  return image[format]().toBuffer();
};

// Lets the 400 px write succeed, then fails the 900 px write with `error`.
function failSecondWrite(error: Error) {
  const realToFile = sharp.prototype.toFile;
  let calls = 0;
  return vi.spyOn(sharp.prototype, "toFile").mockImplementation(function (this: unknown, ...args) {
    calls += 1;
    if (calls === 2) return Promise.reject(error);
    return realToFile.apply(this, args);
  });
}

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
  test("rejects a real GIF", async () => {
    const gif = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#336" } })
      .gif()
      .toBuffer();
    await expect(processImage(gif, dir)).rejects.toBeInstanceOf(InvalidImageError);
  });
  test("lets filesystem errors through", async () => {
    const blocker = path.join(dir, "blocker");
    await writeFile(blocker, "x");
    const error = await processImage(await make(50, 50), path.join(blocker, "sub")).catch(
      (e: unknown) => e,
    );
    expect(error).not.toBeInstanceOf(InvalidImageError);
    expect(error).toMatchObject({ code: expect.any(String) });
  });
  describe("when the 900 px write fails", () => {
    afterEach(() => vi.restoreAllMocks());
    test("removes the 400 px file and rethrows a system error", async () => {
      const local = await mkdtemp(path.join(tmpdir(), "uploads-"));
      const enospc = Object.assign(new Error("no space"), { code: "ENOSPC" });
      failSecondWrite(enospc);
      await expect(processImage(await make(2000, 1200), local)).rejects.toBe(enospc);
      expect(await readdir(local)).toEqual([]);
    });
    test("wraps a coded sharp error as InvalidImageError", async () => {
      const local = await mkdtemp(path.join(tmpdir(), "uploads-"));
      failSecondWrite(Object.assign(new Error("bad input"), { code: "VIPS_FAIL" }));
      await expect(processImage(await make(2000, 1200), local)).rejects.toBeInstanceOf(
        InvalidImageError,
      );
      expect(await readdir(local)).toEqual([]);
    });
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
  beforeAll(() => writeFile(path.join(dir, "secret.txt"), "s"));
  test.each(["../secret.txt", "..\\x-400.webp", "a.webp", "", "x/y-400.webp"])(
    "returns null for unsafe name %j",
    async (name) => {
      expect(await readUpload(name, dir)).toBeNull();
    },
  );
  test("returns null for a well-formed name that does not exist", async () => {
    const name = "00000000-0000-0000-0000-000000000000-400.webp";
    expect(await readUpload(name, dir)).toBeNull();
  });
});
