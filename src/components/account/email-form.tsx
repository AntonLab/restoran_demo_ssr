"use client";

import { useActionState, useState } from "react";
import { type AccountFormState, emailAction } from "@/app/account/actions";
import { AuthField } from "@/components/auth/auth-field";
import { FormFooter } from "@/components/account/form-footer";
import { useFocusFirstError } from "@/components/use-focus-first-error";

const idle: AccountFormState = { status: "idle" };

export function EmailForm({ email: initialEmail }: { email: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [state, action, pending] = useActionState(
    async (prev: AccountFormState, formData: FormData) => {
      const next = await emailAction(prev, formData);
      if (next.status === "success") setPassword("");
      return next;
    },
    idle,
  );
  const formRef = useFocusFirstError(state);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <AuthField
        id="account-email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={setEmail}
        error={errors.email?.[0]}
      />
      <AuthField
        id="account-email-password"
        name="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={setPassword}
        error={errors.currentPassword?.[0]}
      />
      <FormFooter state={state} pending={pending} label="Change email" />
    </form>
  );
}
