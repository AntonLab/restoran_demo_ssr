"use client";

import { useOptimistic, useState, useTransition } from "react";
import { addToCartAction, setQtyAction } from "@/app/cart/actions";
import { Button } from "@/components/ui/button";
import { MAX_QTY } from "@/lib/cart-limits";
import type { Viewer } from "@/lib/viewer";

const GENERIC_ERROR = "Could not update your cart. Try again.";

export function AddToCart({
  dishId,
  name,
  inStock,
  viewer,
}: {
  dishId: string;
  name: string;
  inStock: boolean;
  viewer: Viewer;
}) {
  // The confirmed value comes from props: the Actions revalidate the layout.
  const qty = viewer.cartQty[dishId] ?? 0;
  const [optimistic, setOptimistic] = useOptimistic(qty, (_: number, next: number) => next);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (viewer.role === "admin") return null;

  const run = (
    next: number,
    action: () => Promise<{ ok: true } | { ok: false; error: string }>,
  ) => {
    setError(null);
    startTransition(async () => {
      setOptimistic(next);
      try {
        const r = await action();
        if (!r.ok) setError(r.error);
      } catch {
        setError(GENERIC_ERROR);
      }
    });
  };

  return (
    <div className="relative z-10 flex flex-wrap items-center gap-2">
      {optimistic === 0 ? (
        <Button
          size="sm"
          disabled={!inStock || isPending}
          onClick={() => run(1, () => addToCartAction(dishId))}
        >
          Add to cart
        </Button>
      ) : (
        <fieldset
          aria-label={`Quantity of ${name} in your cart`}
          className="m-0 flex min-w-0 items-center gap-2 border-0 p-0"
        >
          <Button
            size="sm"
            variant="outline"
            aria-label={`Remove one ${name}`}
            disabled={isPending}
            onClick={() => run(optimistic - 1, () => setQtyAction(dishId, optimistic - 1))}
          >
            −
          </Button>
          <output aria-live="polite" className="min-w-6 text-center font-semibold">
            {optimistic}
          </output>
          <Button
            size="sm"
            variant="outline"
            aria-label={`Add one ${name}`}
            disabled={isPending || !inStock || optimistic >= MAX_QTY}
            onClick={() => run(optimistic + 1, () => setQtyAction(dishId, optimistic + 1))}
          >
            +
          </Button>
        </fieldset>
      )}
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
