import { z } from "zod";
import { complaintInputSchema, HONEYPOT_FIELD, reviewInputSchema } from "@/lib/feedback-schemas";
import { roundRating } from "@/lib/ratings";
import { connectDb } from "@/server/db";
import { nextNumber } from "@/server/counter";
import { Complaint } from "@/server/models/complaint";
import { Review } from "@/server/models/review";
import { createRateLimiter, formatRetry, type Limiter } from "@/server/rate-limit";

export type FieldErrors = Record<string, string[]>;
type Failure = { ok: false; error: string; fieldErrors?: FieldErrors };

const limiterOptions = { limit: 5, windowMs: 3_600_000 };
export const reviewLimiter = createRateLimiter(limiterOptions);
export const complaintLimiter = createRateLimiter(limiterOptions);

function isHoneypotFilled(input: unknown): boolean {
  if (typeof input !== "object" || input === null) return false;
  const value = (input as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof value === "string" ? value !== "" : Boolean(value);
}

// Validate before limiter.hit: invalid input must not spend a hit.
function guard<T extends z.ZodType>(
  schema: T,
  input: unknown,
  ip: string,
  limiter: Limiter,
): { data: z.output<T> } | { failure: Failure } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      failure: {
        ok: false,
        error: "Please fix the highlighted fields.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors as FieldErrors,
      },
    };
  }
  const hit = limiter.hit(ip);
  if (!hit.ok) {
    return {
      failure: {
        ok: false,
        error: `Too many submissions. Try again in ${formatRetry(hit.retryAfterMs)}.`,
      },
    };
  }
  return { data: parsed.data };
}

export async function submitReview(
  input: unknown,
  ip: string,
  limiter: Limiter = reviewLimiter,
): Promise<{ ok: true } | Failure> {
  if (isHoneypotFilled(input)) return { ok: true };
  const checked = guard(reviewInputSchema, input, ip, limiter);
  if ("failure" in checked) return checked.failure;
  await connectDb();
  await Review.create(checked.data);
  return { ok: true };
}

export async function submitComplaint(
  input: unknown,
  ip: string,
  limiter: Limiter = complaintLimiter,
): Promise<{ ok: true; number: number } | Failure> {
  if (isHoneypotFilled(input)) return { ok: true, number: 0 };
  const checked = guard(complaintInputSchema, input, ip, limiter);
  if ("failure" in checked) return checked.failure;
  await connectDb();
  // Gaps are acceptable: a failed create burns a number; a transaction needs a replica set.
  const number = await nextNumber("complaint");
  await Complaint.create({ ...checked.data, number });
  return { ok: true, number };
}

export type PublicReview = {
  id: string;
  dishesRating: number;
  serviceRating: number;
  text: string;
  createdAt: string;
};

export async function listApprovedReviews(
  opts: { offset?: number; limit?: number } = {},
): Promise<{ reviews: PublicReview[]; total: number }> {
  const limit = Math.min(50, Math.max(1, opts.limit ?? 10));
  const offset = Math.max(0, opts.offset ?? 0);
  await connectDb();
  const [rows, total] = await Promise.all([
    Review.find({ status: "approved" })
      .sort({ createdAt: -1, _id: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Review.countDocuments({ status: "approved" }),
  ]);
  return {
    total,
    reviews: rows.map((r) => ({
      id: String(r._id),
      dishesRating: r.dishesRating,
      serviceRating: r.serviceRating,
      text: r.text,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function getReviewStats(): Promise<{
  dishes: number | null;
  service: number | null;
  count: number;
}> {
  await connectDb();
  const [stats] = await Review.aggregate<{ dishes: number; service: number; count: number }>([
    { $match: { status: "approved" } },
    {
      $group: {
        _id: null,
        dishes: { $avg: "$dishesRating" },
        service: { $avg: "$serviceRating" },
        count: { $sum: 1 },
      },
    },
  ]);
  if (!stats) return { dishes: null, service: null, count: 0 };
  return {
    dishes: roundRating(stats.dishes),
    service: roundRating(stats.service),
    count: stats.count,
  };
}
