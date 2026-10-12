import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { complaintAction, loadMoreReviews, reviewAction } from "@/app/feedback/actions";
import { Complaint } from "@/server/models/complaint";
import { Review } from "@/server/models/review";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";
import { untilRefused } from "@/server/test/fixtures";
import { formOf } from "@/server/test/form";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

const IDLE = { status: "idle" } as const;
const seed = async (n: number) =>
  Review.insertMany(
    Array.from({ length: n }, (_, i) => ({
      dishesRating: 5,
      serviceRating: 5,
      text: `r${i}`,
      status: "approved",
      createdAt: new Date(1_000_000 + i),
    })),
  );
const review = { dishesRating: "5", serviceRating: "4", text: "Lovely" };

describe("reviewAction", () => {
  test("stores a valid review as pending", async () => {
    expect(await reviewAction(IDLE, formOf(review))).toEqual({ status: "success" });
    expect(await Review.findOne().lean()).toMatchObject({ status: "pending", text: "Lovely" });
  });
  test("zod rejects bad input with field errors and stores nothing", async () => {
    const state = await reviewAction(
      IDLE,
      formOf({ dishesRating: "9", serviceRating: "", text: " " }),
    );
    expect(state).toMatchObject({
      status: "error",
      fieldErrors: {
        dishesRating: expect.any(Array),
        serviceRating: expect.any(Array),
        text: expect.any(Array),
      },
    });
    expect(await Review.countDocuments()).toBe(0);
  });
  test("is refused once the hourly limit is spent", async () => {
    const state = await untilRefused(() => reviewAction(IDLE, formOf(review)), 5);
    expect(state).toMatchObject({ status: "error", error: expect.stringContaining("Too many") });
    expect(await Review.countDocuments()).toBeLessThanOrEqual(5);
  });
});

describe("complaintAction", () => {
  test("stores a valid complaint and returns its number", async () => {
    expect(await complaintAction(IDLE, formOf({ text: "Cold soup", contact: "a@b.co" }))).toEqual({
      status: "success",
      number: 1,
    });
    expect(await Complaint.countDocuments()).toBe(1);
  });
  test("zod rejects a missing contact", async () => {
    expect(await complaintAction(IDLE, formOf({ text: "Cold soup", contact: "" }))).toMatchObject({
      status: "error",
      fieldErrors: { contact: expect.any(Array) },
    });
    expect(await Complaint.countDocuments()).toBe(0);
  });
  test("is refused once the hourly limit is spent", async () => {
    const state = await untilRefused(
      () => complaintAction(IDLE, formOf({ text: "Cold soup", contact: "a@b.co" })),
      5,
    );
    expect(state).toMatchObject({ status: "error", error: expect.stringContaining("Too many") });
  });
});

describe("loadMoreReviews", () => {
  test("pages by offset, 10 at a time", async () => {
    await seed(12);
    const page = await loadMoreReviews(10);
    expect(page.total).toBe(12);
    expect(page.reviews).toHaveLength(2);
  });
  test.each([-5, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "clamps offset %s to the first page",
    async (offset) => {
      await seed(12);
      const page = await loadMoreReviews(offset);
      expect(page.reviews).toHaveLength(10);
      expect(page.reviews[0].text).toBe("r11");
    },
  );
});
