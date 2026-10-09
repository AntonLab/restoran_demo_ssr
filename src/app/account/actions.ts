"use server";

import { revalidatePath } from "next/cache";
import { changeEmail, changePassword, updateContacts } from "@/server/account-settings";
import type { AccountFailure } from "@/server/accounts";
import { actionUser } from "@/server/auth/guards";
import type { FieldErrors } from "@/server/feedback";

export type AccountFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; error: string; fieldErrors?: FieldErrors };

type Outcome = { ok: true } | AccountFailure;

// `failed` in the auth actions file is private: a "use server" module exports only actions.
function toState(result: Outcome, message: string, revalidate: boolean): AccountFormState {
  if (!result.ok) return { status: "error", error: result.error, fieldErrors: result.fieldErrors };
  if (revalidate) revalidatePath("/account");
  return { status: "success", message };
}

const SIGN_IN: AccountFormState = { status: "error", error: "Sign in as a user to do this." };

export async function contactsAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await actionUser();
  if (!session) return SIGN_IN;
  const result = await updateContacts(session.user.id, Object.fromEntries(formData));
  return toState(result, "Details saved.", true);
}

export async function emailAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await actionUser();
  if (!session) return SIGN_IN;
  const result = await changeEmail(session.user.id, Object.fromEntries(formData));
  return toState(result, "Email changed.", true);
}

export async function passwordAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await actionUser();
  if (!session) return SIGN_IN;
  const result = await changePassword(
    session.user.id,
    session.sessionId,
    Object.fromEntries(formData),
  );
  return toState(result, "Password changed.", false);
}
