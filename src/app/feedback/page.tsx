import type { Metadata } from "next";
import { connection } from "next/server";
import { ComplaintForm } from "@/components/feedback/complaint-form";
import { ReviewForm } from "@/components/feedback/review-form";
import { RatingRow } from "@/components/feedback/rating-row";
import { ReviewsList } from "@/components/feedback/reviews-list";
import { getReviewStats, listApprovedReviews } from "@/server/feedback";

export const metadata: Metadata = { title: "Leave feedback" };

function Average({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-4xl font-bold">{value.toFixed(1)}</span>
      <RatingRow value={Math.round(value)} />
    </div>
  );
}

export default async function Page() {
  await connection();
  const [stats, { reviews, total }] = await Promise.all([
    getReviewStats(),
    listApprovedReviews({ limit: 10 }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <h1 className="text-4xl font-bold">Leave feedback</h1>
      <section aria-label="Ratings" className="flex flex-wrap items-end gap-8">
        {stats.dishes === null || stats.service === null ? (
          <p className="text-muted-foreground">No reviews yet</p>
        ) : (
          <>
            <Average label="Dishes" value={stats.dishes} />
            <Average label="Service" value={stats.service} />
            <p className="text-sm text-muted-foreground">Based on {stats.count} reviews</p>
          </>
        )}
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Leave a review</h2>
          <ReviewForm />
        </section>
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Make a complaint</h2>
          <ComplaintForm />
        </section>
      </div>
      <section>
        <h2 className="mb-4 text-2xl font-semibold">Reviews</h2>
        <ReviewsList initial={reviews} total={total} />
      </section>
    </div>
  );
}
