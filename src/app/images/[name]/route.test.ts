import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { GET } from "@/app/images/[name]/route";

let root: string;
let uploads: string;
vi.mock("@/server/env", () => ({ getEnv: () => ({ UPLOADS_DIR: uploads }) }));

const get = (name: string) =>
  GET(new Request("http://localhost/images/x"), { params: Promise.resolve({ name }) } as never);
const goodName = `${randomUUID()}-400.webp`;
const bytes = Buffer.from("fake-webp-bytes");

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), "images-route-"));
  uploads = path.join(root, "uploads");
  await mkdir(uploads);
  await writeFile(path.join(uploads, goodName), bytes);
  // A well-formed name one level up: reachable only by escaping the uploads directory.
  await writeFile(path.join(root, goodName), "secret");
});
afterAll(() => rm(root, { recursive: true, force: true }));

describe("GET /images/[name]", () => {
  test("serves a stored file as immutable WebP", async () => {
    const res = await get(goodName);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(Buffer.from(await res.arrayBuffer())).toEqual(bytes);
  });
  test.each(["photo.png", "abc-400.webp", `${randomUUID()}-500.webp`, ""])(
    "a bad name %j gets 404",
    async (name) => {
      expect((await get(name)).status).toBe(404);
    },
  );
  test.each([
    `../${goodName}`,
    `..\\${goodName}`,
    `%2e%2e/${goodName}`,
    `${randomUUID()}-400.webp/../../x`,
  ])("a traversal attempt %j gets 404", async (name) => {
    expect((await get(name)).status).toBe(404);
  });
  test("a well-formed name with no file gets 404", async () => {
    expect((await get(`${randomUUID()}-900.webp`)).status).toBe(404);
  });
});
