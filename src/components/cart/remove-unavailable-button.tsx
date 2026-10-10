"use client";

import { useState, useTransition } from "react";
import { removeUnavailableAction } from "@/app/cart/actions";
import { Button } from "@/components/ui/button";

export function RemoveUnavailableButton() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = () => {
    setError(null);
    startTransition(async () => {
      try {
        const r = await removeUnavailableAction();
        if (!r.ok) setError(r.error);
      } catch {
        setError("Could not update your cart. Try again.");
      }
    });
  };

  return (
    <>
      <Button variant="outline" disabled={isPending} onClick={run}>
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
