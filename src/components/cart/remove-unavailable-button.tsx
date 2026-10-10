"use client";

import { removeUnavailableAction } from "@/app/cart/actions";
import { useCartAction } from "@/components/cart/use-cart-action";
import { Button } from "@/components/ui/button";

export function RemoveUnavailableButton() {
  const { pending, error, run } = useCartAction();

  return (
    <>
      <Button variant="outline" disabled={pending} onClick={() => run(removeUnavailableAction)}>
        Remove unavailable
      </Button>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </>
  );
}
