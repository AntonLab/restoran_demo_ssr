"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { clientIp } from "@/lib/client-ip";
import { authenticate, registerUser, type AccountFailure } from "@/server/accounts";
import { postLoginPath } from "@/server/auth/next-path";
import { createSession, revokeSession } from "@/server/auth/session";
import { SESSION_COOKIE } from "@/server/auth/session-store";
import { getEnv } from "@/server/env";
import type { FieldErrors } from "@/server/feedback";
import { getMailDelivery } from "@/server/mail";
import { requestPasswordReset, resetPassword } from "@/server/password-reset";

export type AuthFormState =
  | { status: "idle" }
  | { status: "error"; error: string; fieldErrors?: FieldErrors }
  | { status: "sent" };

const failed = ({ error, fieldErrors }: AccountFailure): AuthFormState => ({
  status: "error",
  error,
  fieldErrors,
});

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await registerUser(Object.fromEntries(formData), clientIp(await headers()));
  if (!result.ok) return failed(result);
  await createSession(result.userId);
  redirect(postLoginPath(formData.get("next"), "user"));
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await authenticate(Object.fromEntries(formData), clientIp(await headers()));
  if (!result.ok) return failed(result);
  await createSession(result.userId);
  redirect(postLoginPath(formData.get("next"), result.role));
}

export async function logoutAction(): Promise<void> {
  await revokeSession();
  redirect("/");
}

export async function forgotPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await requestPasswordReset(Object.fromEntries(formData), {
    ip: clientIp(await headers()),
    baseUrl: getEnv().APP_BASE_URL,
  });
  if (!result.ok) return failed(result);
  const { mail } = result;
  if (mail) {
    after(async () => {
      try {
        await getMailDelivery().send(mail);
      } catch {
        // No address and no token: the log must not leak either.
        console.error("Password reset mail failed");
      }
    });
  }
  return { status: "sent" };
}

export async function resetPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await resetPassword(Object.fromEntries(formData));
  if (!result.ok) return failed(result);
  // The reset deleted every Session; clearing the cookie also makes Next refresh the cached header.
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login?reset=1");
}
