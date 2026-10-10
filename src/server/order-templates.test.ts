import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { OrderTemplate } from "@/server/models/order-template";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  recordCheckoutTemplate,
  updateTemplate,
} from "@/server/order-templates";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(async () => {
  await startTestDb();
  await OrderTemplate.init();
});
afterAll(stopTestDb);
beforeEach(clearTestDb);

const uid = () => String(new mongoose.Types.ObjectId());
const input = (n = 1) => ({ name: "Ann", phone: "+1 555 123 4567", address: `${n} Main Street` });
const own = (userId: string) => OrderTemplate.find({ userId }).lean();

describe("createTemplate", () => {
  test("stores a normalized template", async () => {
    const u = uid();
    expect(await createTemplate(u, input())).toEqual({ ok: true });
    expect(await listTemplates(u)).toMatchObject([
      { name: "Ann", phone: "+15551234567", address: "1 Main Street" },
    ]);
  });
  test("invalid input gives field errors", async () => {
    const r = await createTemplate(uid(), { ...input(), address: "abc" });
    expect(r).toMatchObject({ ok: false, fieldErrors: { address: [expect.any(String)] } });
  });
  test("refuses a sixth template", async () => {
    const u = uid();
    for (let i = 1; i <= 5; i++) await createTemplate(u, input(i));
    expect(await createTemplate(u, input(6))).toMatchObject({
      ok: false,
      error: "Template limit reached.",
    });
    expect(await own(u)).toHaveLength(5);
  });
  test("refuses a duplicate combination", async () => {
    const u = uid();
    await createTemplate(u, input());
    expect(await createTemplate(u, input())).toMatchObject({ ok: false });
    expect(await own(u)).toHaveLength(1);
  });
});

describe("update and delete are owner-scoped", () => {
  test("edits and deletes own templates", async () => {
    const u = uid();
    await createTemplate(u, input());
    const [t] = await listTemplates(u);
    expect(await updateTemplate(u, t.id, input(2))).toEqual({ ok: true });
    expect((await listTemplates(u))[0].address).toBe("2 Main Street");
    expect(await deleteTemplate(u, t.id)).toEqual({ ok: true });
    expect(await own(u)).toHaveLength(0);
  });
  test("another user cannot touch it; bad ids do not throw", async () => {
    const u = uid();
    await createTemplate(u, input());
    const [t] = await listTemplates(u);
    expect(await updateTemplate(uid(), t.id, input(2))).toMatchObject({ ok: false });
    expect(await deleteTemplate(uid(), t.id)).toMatchObject({ ok: false });
    expect(await deleteTemplate(u, "zzz")).toMatchObject({ ok: false });
    expect(await own(u)).toHaveLength(1);
  });
  test("an edit that duplicates another template is refused", async () => {
    const u = uid();
    await createTemplate(u, input(1));
    await createTemplate(u, input(2));
    const second = (await listTemplates(u)).find((t) => t.address.startsWith("2"))!;
    expect(await updateTemplate(u, second.id, input(1))).toMatchObject({ ok: false });
  });
});

test("listTemplates orders by lastUsedAt and hides other users", async () => {
  const u = uid();
  await OrderTemplate.create({
    userId: u,
    ...input(1),
    phone: "+15551234567",
    lastUsedAt: new Date("2026-01-01"),
  });
  await OrderTemplate.create({
    userId: u,
    ...input(2),
    phone: "+15551234567",
    lastUsedAt: new Date("2026-02-01"),
  });
  await OrderTemplate.create({ userId: uid(), ...input(3), phone: "+15551234567" });
  expect((await listTemplates(u)).map((t) => t.address)).toEqual([
    "2 Main Street",
    "1 Main Street",
  ]);
});

const contact = (n = 1) => ({ name: "Ann", phone: "+15551234567", address: `${n} Main Street` });

describe("recordCheckoutTemplate", () => {
  test("an exact match only refreshes lastUsedAt, even when save is false", async () => {
    const u = uid();
    await createTemplate(u, input());
    const later = new Date(Date.now() + 60_000);
    await recordCheckoutTemplate(u, contact(), false, later);
    const all = await own(u);
    expect(all).toHaveLength(1);
    expect(all[0].lastUsedAt).toEqual(later);
  });
  test("a new combination is saved only when asked", async () => {
    const u = uid();
    await recordCheckoutTemplate(u, contact(), false);
    expect(await own(u)).toHaveLength(0);
    await recordCheckoutTemplate(u, contact(), true);
    expect(await own(u)).toHaveLength(1);
  });
  test("at the limit nothing is added and nothing throws", async () => {
    const u = uid();
    for (let i = 1; i <= 5; i++) await createTemplate(u, input(i));
    await expect(recordCheckoutTemplate(u, contact(9), true)).resolves.toBeUndefined();
    expect(await own(u)).toHaveLength(5);
  });
});
