import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import mongoose from "mongoose";
import { Complaint } from "@/server/models/complaint";
import { Dish } from "@/server/models/dish";
import { Review } from "@/server/models/review";
import { Settings } from "@/server/models/settings";
import { DEFAULT_SETTINGS } from "@/server/settings-defaults";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

const dish = {
  name: "Soup",
  shortDescription: "s",
  fullDescription: "f",
  weight: "300 g",
  priceCents: 850,
  categoryId: new mongoose.Types.ObjectId(),
};

describe("Dish", () => {
  test("applies defaults", async () => {
    const d = new Dish(dish);
    await d.validate();
    expect(d).toMatchObject({
      isChefChoice: false,
      inStock: true,
      status: "active",
      order: 0,
      favoritesCount: 0,
    });
    expect(d.deletedAt).toBeNull();
  });
  test.each([8.5, -1, Number.NaN])("rejects priceCents %s", async (priceCents) => {
    await expect(new Dish({ ...dish, priceCents }).validate()).rejects.toThrow();
  });
});

describe("Review", () => {
  const ok = { dishesRating: 5, serviceRating: 4, text: "Great" };
  test("defaults to pending, contact optional", async () => {
    const r = new Review(ok);
    await r.validate();
    expect(r.status).toBe("pending");
    expect(r.contact).toBeUndefined();
  });
  test.each([0, 6, 3.5])("rejects rating %s", async (n) => {
    await expect(new Review({ ...ok, dishesRating: n }).validate()).rejects.toThrow();
    await expect(new Review({ ...ok, serviceRating: n }).validate()).rejects.toThrow();
  });
  test("rejects missing and over-long text", async () => {
    await expect(new Review({ ...ok, text: "" }).validate()).rejects.toThrow();
    await expect(new Review({ ...ok, text: "x".repeat(1001) }).validate()).rejects.toThrow();
  });
});

describe("Complaint", () => {
  test("requires contact, defaults to new", async () => {
    await expect(new Complaint({ number: 1, text: "cold" }).validate()).rejects.toThrow();
    const c = new Complaint({ number: 1, text: "cold", contact: "a@b.c" });
    await c.validate();
    expect(c.status).toBe("new");
  });
  test("number is unique", async () => {
    await Complaint.init();
    await Complaint.create({ number: 1, text: "a", contact: "c" });
    await expect(Complaint.create({ number: 1, text: "b", contact: "c" })).rejects.toThrow();
  });
});

describe("Settings", () => {
  test("DEFAULT_SETTINGS is valid and named Verde Kitchen", async () => {
    await new Settings(DEFAULT_SETTINGS).validate();
    expect(DEFAULT_SETTINGS.name).toBe("Verde Kitchen");
    expect(DEFAULT_SETTINGS.schedule).toHaveLength(7);
  });
  test("rejects a schedule that is not 7 days", async () => {
    const bad = { ...DEFAULT_SETTINGS, schedule: DEFAULT_SETTINGS.schedule.slice(0, 6) };
    await expect(new Settings(bad).validate()).rejects.toThrow();
  });
});
