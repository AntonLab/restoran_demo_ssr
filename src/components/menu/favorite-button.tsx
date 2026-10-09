"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/app/menu/favorite-actions";
import type { Viewer } from "@/lib/viewer";

const style = "flex items-center gap-1 text-sm text-muted-foreground";
const GENERIC_ERROR = "Could not update favorites. Try again.";

function Count({ count }: { count: number }) {
  return (
    <>
      <span aria-hidden>{count}</span>
      <span className="sr-only">{count} favorites</span>
    </>
  );
}

export function FavoriteButton({
  dishId,
  count,
  viewer,
}: {
  dishId: string;
  count: number;
  viewer: Viewer;
}) {
  const router = useRouter();
  // The confirmed value comes from props: the Action revalidates, so the page
  // (also one kept mounted under the Dish modal) re-renders with the server value.
  const favorited = viewer.favoriteIds.includes(dishId);
  const [view, setOptimistic] = useOptimistic(
    { favorited, count },
    (_: { favorited: boolean; count: number }, next: { favorited: boolean; count: number }) => next,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (viewer.role === "admin") {
    return (
      <span className={style}>
        <Heart aria-hidden className="size-4" />
        <Count count={count} />
      </span>
    );
  }
  if (viewer.role === "guest") {
    return (
      <Link
        href="/login"
        aria-label="Sign in to add to favorites"
        // Read the URL at click time so the Dish modal and filtered Menu return exactly here.
        onClick={(e) => {
          e.preventDefault();
          const here = window.location.pathname + window.location.search;
          router.push(`/login?next=${encodeURIComponent(here)}`);
        }}
        className={`${style} relative z-10 rounded-md hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none`}
      >
        <Heart aria-hidden className="size-4" />
        <Count count={count} />
      </Link>
    );
  }

  const toggle = () => {
    setError(null);
    startTransition(async () => {
      setOptimistic({
        favorited: !view.favorited,
        count: view.count + (view.favorited ? -1 : 1),
      });
      try {
        const r = await toggleFavoriteAction(dishId);
        if (!r.ok) setError(r.error);
      } catch {
        setError(GENERIC_ERROR);
      }
    });
  };

  return (
    <span className="relative z-10 flex items-center gap-2">
      <button
        type="button"
        aria-pressed={view.favorited}
        disabled={isPending}
        onClick={toggle}
        className={`${style} rounded-md hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none`}
      >
        <Heart aria-hidden className={view.favorited ? "size-4 fill-current" : "size-4"} />
        <span aria-hidden>{view.count}</span>
        <span className="sr-only">Favorite, {view.count} favorites</span>
      </button>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}
