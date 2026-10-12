"use server";

import { SIGN_IN, toState, type AccountFormState } from "@/app/account/form-state";
import { changeEmail, changePassword, updateContacts } from "@/server/account-settings";
import { actionUser } from "@/server/auth/guards";

export type { AccountFormState };

export async function contactsAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await actionUser();
  if (!session) return SIGN_IN;
  const result = await updateContacts(session.user.id, Object.fromEntries(formData));
  return toState(result, "Details saved.", "/account");
}

export async function emailAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await actionUser();
  if (!session) return SIGN_IN;
  const result = await changeEmail(session.user.id, Object.fromEntries(formData));
  return toState(result, "Email changed.", "/account");
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
  return toState(result, "Password changed.");
}
