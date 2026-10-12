"use client";

import { useEffect, useRef } from "react";
import { focusFirstInvalid } from "@/lib/focus-first-error";

// Each failed submit returns a new state object, so the effect re-runs per attempt.
export function useFocusFirstError(state: { status: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "error") focusFirstInvalid(formRef.current);
  }, [state]);
  return formRef;
}
