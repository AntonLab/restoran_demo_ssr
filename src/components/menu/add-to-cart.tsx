"use client";

import { useOptimistic } from "react";
import { addToCartAction, setQtyAction } from "@/app/cart/actions";
import { useCartAction } from "@/components/cart/use-cart-action";
import { Button } from "@/components/ui/button";
import { MAX_QTY } from "@/lib/cart-limits";
import type { Viewer } from "@/lib/viewer";

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
  const qty = viewer.cartQty[dishId] ?? 0;
  const [optimistic, setOptimistic] = useOptimistic(qty, (_: number, next: number) => next);
  const { pending: isPending, error, run: runAction } = useCartAction();

  if (viewer.role === "admin") return null;

  const run = (next: number, action: Parameters<typeof runAction>[0]) =>
    runAction(action, () => setOptimistic(next));

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
