"use client";

import { useState, useTransition } from "react";

const GENERIC_ERROR = "Could not update your cart. Try again.";

type ActionResult = { ok: true } | { ok: false; error: string };

// `before` runs inside the transition ahead of the action, so an optimistic update stays tied to it.
export function useCartAction() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult>, before?: () => void) => {
    setError(null);
    startTransition(async () => {
      before?.();
      try {
        const r = await action();
        if (!r.ok) setError(r.error);
      } catch {
        setError(GENERIC_ERROR);
      }
    });
  };

  return { pending, error, run };
}
