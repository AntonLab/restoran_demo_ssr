import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import { Settings } from "@/server/models/settings";
import { getSettings } from "@/server/queries/settings";
import { DEFAULT_SETTINGS } from "@/server/settings-defaults";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

test("falls back to defaults when the seed has not run", async () => {
  expect((await getSettings()).name).toBe("Verde Kitchen");
});

test("defaults are a fresh copy per call", async () => {
  (await getSettings()).name = "Mutated";
  expect((await getSettings()).name).toBe("Verde Kitchen");
});

test("returns the stored document as a plain object", async () => {
  await Settings.create({ ...DEFAULT_SETTINGS, name: "Other Place" });
  const s = await getSettings();
  expect(s.name).toBe("Other Place");
  expect(s.schedule).toHaveLength(7);
  expect(JSON.parse(JSON.stringify(s))).toEqual(s);
});
