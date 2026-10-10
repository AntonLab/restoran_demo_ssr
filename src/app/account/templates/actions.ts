"use server";

import { revalidatePath } from "next/cache";
import { SIGN_IN, toState, type AccountFormState } from "@/app/account/form-state";
import { actionUser } from "@/server/auth/guards";
import {
  createTemplate,
  deleteTemplate,
  updateTemplate,
  type TemplateResult,
} from "@/server/order-templates";

export async function templateAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const session = await actionUser();
  if (!session) return SIGN_IN;
  const { id, ...data } = Object.fromEntries(formData);
  const userId = session.user.id;
  const result = id
    ? await updateTemplate(userId, String(id), data)
    : await createTemplate(userId, data);
  return toState(result, "Template saved.", "/account/templates");
}

export async function deleteTemplateAction(id: string): Promise<TemplateResult> {
  const session = await actionUser();
  if (!session) return { ok: false, error: "Sign in as a user to do this." };
  const result = await deleteTemplate(session.user.id, id);
  if (result.ok) revalidatePath("/account/templates");
  return result;
}
