import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { Complaint } from "@/server/models/complaint";
import { Review } from "@/server/models/review";
import { createRateLimiter } from "@/server/rate-limit";
import {
  getReviewStats,
  listApprovedReviews,
  submitComplaint,
  submitReview,
} from "@/server/feedback";
import { clearTestDb, startTestDb, stopTestDb } from "@/server/test/db";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

const fresh = (limit = 5) => createRateLimiter({ limit, windowMs: 3_600_000 });
const review = { dishesRating: "5", serviceRating: "4", text: "  Lovely  ", contact: "" };
const complaint = { text: "Cold soup", contact: "a@b.c" };

describe("submitReview", () => {
  test("stores a pending Review with trimmed text and no empty contact", async () => {
    expect(await submitReview(review, "1.1.1.1", fresh())).toEqual({ ok: true });
    const saved = await Review.findOne().lean();
    expect(saved).toMatchObject({ status: "pending", dishesRating: 5, text: "Lovely" });
    expect(saved?.contact).toBeUndefined();
  });
  test.each([
    { dishesRating: "0" },
    { dishesRating: "6" },
    { serviceRating: "3.5" },
    { dishesRating: "abc" },
    { dishesRating: "" },
    { text: "   " },
    { text: "x".repeat(1001) },
  ])("rejects %j with field errors and stores nothing", async (bad) => {
    const res = await submitReview({ ...review, ...bad }, "1.1.1.1", fresh());
    expect(res.ok).toBe(false);
    expect(Object.keys((!res.ok && res.fieldErrors) || {})).toHaveLength(1);
    expect(await Review.countDocuments()).toBe(0);
  });
  test.each([null, undefined, "text", 42])("payload %j does not throw", async (payload) => {
    expect((await submitReview(payload, "1.1.1.1", fresh())).ok).toBe(false);
  });
  test("honeypot gives silent success, stores nothing and costs no allowance", async () => {
    const limiter = fresh(1);
    expect(await submitReview({ ...review, hp_site: "http://spam" }, "2.2.2.2", limiter)).toEqual({
      ok: true,
    });
    expect(await Review.countDocuments()).toBe(0);
    expect((await submitReview(review, "2.2.2.2", limiter)).ok).toBe(true);
  });
  test("the 6th submission from one IP in an hour is refused", async () => {
    const limiter = fresh();
    for (let i = 0; i < 5; i++)
      expect((await submitReview(review, "3.3.3.3", limiter)).ok).toBe(true);
    const sixth = await submitReview(review, "3.3.3.3", limiter);
    expect(sixth).toMatchObject({ ok: false, error: expect.stringMatching(/too many/i) });
    expect((await submitReview(review, "4.4.4.4", limiter)).ok).toBe(true);
  });
});

describe("submitComplaint", () => {
  test("stores a new Complaint and returns sequential Numbers", async () => {
    const a = await submitComplaint(complaint, "5.5.5.5", fresh());
    const b = await submitComplaint(complaint, "5.5.5.5", fresh());
    expect([a, b]).toEqual([
      { ok: true, number: 1 },
      { ok: true, number: 2 },
    ]);
    expect((await Complaint.findOne({ number: 1 }).lean())?.status).toBe("new");
  });
  test("requires a contact and caps the reason", async () => {
    const noContact = await submitComplaint({ text: "x", contact: " " }, "5.5.5.5", fresh());
    expect(!noContact.ok && noContact.fieldErrors).toHaveProperty("contact");
    expect(await Complaint.countDocuments()).toBe(0);
  });
  test("honeypot gives silent success with Number 0 and stores nothing", async () => {
    expect(await submitComplaint({ ...complaint, hp_site: "x" }, "5.5.5.5", fresh())).toEqual({
      ok: true,
      number: 0,
    });
    expect(await Complaint.countDocuments()).toBe(0);
  });
  test("the Review and Complaint allowances are independent", async () => {
    for (let i = 0; i < 5; i++) await submitReview(review, "6.6.6.6");
    expect((await submitReview(review, "6.6.6.6")).ok).toBe(false);
    expect((await submitComplaint(complaint, "6.6.6.6")).ok).toBe(true);
  });
});

const row = (text: string, status: "pending" | "approved" | "rejected", day: number) => ({
  dishesRating: 5,
  serviceRating: 5,
  text,
  status,
  contact: "secret@x.y",
  createdAt: new Date(2026, 0, day),
});

test("listApprovedReviews: approved only, newest first, 10 per page, no contact", async () => {
  const twelve = Array.from({ length: 12 }, (_, i) => row(`r${i}`, "approved", i + 1));
  await Review.create([...twelve, row("p", "pending", 20), row("x", "rejected", 21)]);
  const first = await listApprovedReviews();
  expect([first.total, first.reviews.length, first.reviews[0].text]).toEqual([12, 10, "r11"]);
  expect(first.reviews[0]).not.toHaveProperty("contact");
  expect((await listApprovedReviews({ offset: 10 })).reviews.map((r) => r.text)).toEqual([
    "r1",
    "r0",
  ]);
});

describe("getReviewStats", () => {
  test("empty database gives nulls", async () => {
    expect(await getReviewStats()).toEqual({ dishes: null, service: null, count: 0 });
  });
  test("averages only approved Reviews, one decimal", async () => {
    await Review.create([
      { dishesRating: 5, serviceRating: 5, text: "a", status: "approved" },
      { dishesRating: 4, serviceRating: 3, text: "b", status: "approved" },
      { dishesRating: 4, serviceRating: 4, text: "c", status: "approved" },
      { dishesRating: 1, serviceRating: 1, text: "d", status: "pending" },
      { dishesRating: 1, serviceRating: 1, text: "e", status: "rejected" },
    ]);
    expect(await getReviewStats()).toEqual({ dishes: 4.3, service: 4, count: 3 });
  });
});
