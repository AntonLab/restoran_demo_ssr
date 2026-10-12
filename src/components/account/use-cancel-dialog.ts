import { useState, useTransition } from "react";
import { cancelFailureText } from "@/lib/list-view";

type CancelResult<S> = { ok: true } | { ok: false; error: string; status?: S };

// One dialog for the list: a failed cancel revalidates and drops the row's Cancel button, which would unmount a per-row dialog before the error is read.
export function useCancelDialog<S extends string>(
  cancel: (number: number) => Promise<CancelResult<S>>,
  statusLabels: Record<S, string>,
  fallbackError: string,
) {
  const [target, setTarget] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const open = (number: number) => {
    setError(null);
    setTarget(number);
  };

  const onOpenChange = (isOpen: boolean) => {
    if (isOpen) return;
    setTarget(null);
    setError(null);
  };

  const confirm = () => {
    if (target === null) return;
    startTransition(async () => {
      try {
        const r = await cancel(target);
        if (r.ok) setTarget(null);
        else setError(cancelFailureText(statusLabels, r.error, r.status));
      } catch {
        setError(fallbackError);
      }
    });
  };

  return { target, error, pending, open, onOpenChange, confirm };
}
