"use client";

import { Star } from "lucide-react";
import { useState, useTransition } from "react";
import { loadMoreReviews } from "@/app/feedback/actions";
import { Button } from "@/components/ui/button";
import type { PublicReview } from "@/server/feedback";

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function RatingRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-14 text-muted-foreground">{label}</span>
      <span className="flex">
        <span className="sr-only">{value} out of 5</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden
            className={
              n <= value ? "size-4 fill-primary text-primary" : "size-4 text-muted-foreground"
            }
          />
        ))}
      </span>
    </div>
  );
}

export function ReviewsList({ initial, total }: { initial: PublicReview[]; total: number }) {
  const [list, setList] = useState(initial);
  const [pending, startTransition] = useTransition();

  if (list.length === 0)
    return <p className="text-muted-foreground">No reviews yet. Be the first!</p>;

  function showMore() {
    startTransition(async () => {
      const more = await loadMoreReviews(list.length);
      setList((cur) => {
        const seen = new Set(cur.map((r) => r.id));
        return [...cur, ...more.reviews.filter((r) => !seen.has(r.id))];
      });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {list.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
            <RatingRow label="Dishes" value={r.dishesRating} />
            <RatingRow label="Service" value={r.serviceRating} />
            <p className="whitespace-pre-line">{r.text}</p>
            <time dateTime={r.createdAt} className="text-xs text-muted-foreground">
              {date.format(new Date(r.createdAt))}
            </time>
          </li>
        ))}
      </ul>
      {list.length < total && (
        <Button variant="outline" disabled={pending} onClick={showMore} className="self-center">
          Show more
        </Button>
      )}
    </div>
  );
}
