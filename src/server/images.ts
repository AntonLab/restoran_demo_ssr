import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getEnv } from "@/server/env";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export class InvalidImageError extends Error {
  constructor(message = "Upload a JPEG, PNG or WebP image up to 5 MB") {
    super(message);
    this.name = "InvalidImageError";
  }
}

const SIZES = { small: 400, medium: 900 } as const;
const ALLOWED_FORMATS = ["jpeg", "png", "webp"];
// The strict name shape is the path-traversal guard for readUpload.
const STORED_NAME = /^[0-9a-f-]{36}-(400|900)\.webp$/;

export function getUploadsDir(): string {
  return getEnv().UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
}

export async function processImage(
  input: Buffer,
  dir: string = getUploadsDir(),
): Promise<{ small: string; medium: string }> {
  if (input.length === 0 || input.length > MAX_IMAGE_BYTES) throw new InvalidImageError();
  try {
    const { format } = await sharp(input).metadata();
    if (!format || !ALLOWED_FORMATS.includes(format)) throw new InvalidImageError();
  } catch (error) {
    throw asInvalidImage(error);
  }
  await mkdir(dir, { recursive: true });
  const id = randomUUID();
  const names = { small: `${id}-400.webp`, medium: `${id}-900.webp` };
  try {
    for (const key of ["small", "medium"] as const) {
      await sharp(input)
        .rotate()
        .resize({ width: SIZES[key], withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(dir, names[key]));
    }
  } catch (error) {
    await rm(path.join(dir, names.small), { force: true });
    throw asInvalidImage(error);
  }
  return names;
}

// sharp throws a plain Error on bytes it cannot decode; a Node system error
// (ENOSPC, EACCES, ...) has a string `code` and must keep its real cause.
function asInvalidImage(error: unknown): unknown {
  if (error instanceof Error && "code" in error && typeof error.code === "string") return error;
  return error instanceof InvalidImageError ? error : new InvalidImageError();
}

export async function readUpload(
  name: string,
  dir: string = getUploadsDir(),
): Promise<Buffer | null> {
  if (!STORED_NAME.test(name)) return null;
  try {
    return await readFile(path.join(dir, name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
