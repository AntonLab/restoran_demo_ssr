"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/app/menu/favorite-actions";
import type { Viewer } from "@/lib/viewer";

const style = "flex items-center gap-1 text-sm text-muted-foreground";

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
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [server, setServer] = useState({ favorited: viewer.favoriteIds.includes(dishId), count });
  const [view, setOptimistic] = useOptimistic(server);
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
    const next = encodeURIComponent(search ? `${pathname}?${search}` : pathname);
    return (
      <Link
        href={`/login?next=${next}`}
        aria-label="Sign in to add to favorites"
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
      const r = await toggleFavoriteAction(dishId);
      if (r.ok) setServer({ favorited: r.favorited, count: r.favoritesCount });
      else setError(r.error);
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
        <Count count={view.count} />
        <span className="sr-only">{view.favorited ? "In favorites" : "Add to favorites"}</span>
      </button>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}
