"use client";

import { useState, useTransition } from "react";
import { removeFromCartAction, setQtyAction } from "@/app/cart/actions";
import { Button } from "@/components/ui/button";
import { MAX_QTY } from "@/lib/cart-limits";
import type { CartLine } from "@/server/cart";

const GENERIC_ERROR = "Could not update your cart. Try again.";

export function LineControls({ line }: { line: CartLine }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // The Actions revalidate the layout, so the server value replaces the row: no local qty.
  const run = (action: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setError(null);
    startTransition(async () => {
      try {
        const r = await action();
        if (!r.ok) setError(r.error);
      } catch {
        setError(GENERIC_ERROR);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!line.unavailable && (
        <fieldset
          aria-label={`Quantity of ${line.name} in your cart`}
          className="m-0 flex min-w-0 items-center gap-2 border-0 p-0"
        >
          <Button
            size="sm"
            variant="outline"
            aria-label={`Remove one ${line.name}`}
            disabled={isPending}
            onClick={() => run(() => setQtyAction(line.dishId, line.qty - 1))}
          >
            −
          </Button>
          <output aria-live="polite" className="min-w-6 text-center font-semibold">
            {line.qty}
          </output>
          <Button
            size="sm"
            variant="outline"
            aria-label={`Add one ${line.name}`}
            disabled={isPending || line.qty >= MAX_QTY}
            onClick={() => run(() => setQtyAction(line.dishId, line.qty + 1))}
          >
            +
          </Button>
        </fieldset>
      )}
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Remove ${line.name} from your cart`}
        disabled={isPending}
        onClick={() => run(() => removeFromCartAction(line.dishId))}
      >
        Remove
      </Button>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
