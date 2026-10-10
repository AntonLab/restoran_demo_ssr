import { revalidatePath } from "next/cache";
import type { AccountFailure } from "@/server/accounts";
import type { FieldErrors } from "@/server/feedback";

export type AccountFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; error: string; fieldErrors?: FieldErrors };

type Outcome = { ok: true } | AccountFailure;

// Lives outside the "use server" modules: those may export only actions.
export function toState(result: Outcome, message: string, revalidate?: string): AccountFormState {
  if (!result.ok) return { status: "error", error: result.error, fieldErrors: result.fieldErrors };
  if (revalidate) revalidatePath(revalidate);
  return { status: "success", message };
}

export const SIGN_IN: AccountFormState = {
  status: "error",
  error: "Sign in as a user to do this.",
};
