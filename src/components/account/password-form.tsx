"use client";

import { useActionState, useState } from "react";
import { type AccountFormState, passwordAction } from "@/app/account/actions";
import { AuthField } from "@/components/auth/auth-field";
import { FormFooter } from "@/components/account/form-footer";
import { useFocusFirstError } from "@/components/use-focus-first-error";

const idle: AccountFormState = { status: "idle" };

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [state, action, pending] = useActionState(
    async (prev: AccountFormState, formData: FormData) => {
      const next = await passwordAction(prev, formData);
      if (next.status === "success") {
        setCurrentPassword("");
        setNewPassword("");
      }
      return next;
    },
    idle,
  );
  const formRef = useFocusFirstError(state);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <AuthField
        id="account-current-password"
        name="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        required
        value={currentPassword}
        onChange={setCurrentPassword}
        error={errors.currentPassword?.[0]}
      />
      <AuthField
        id="account-new-password"
        name="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        value={newPassword}
        onChange={setNewPassword}
        error={errors.newPassword?.[0]}
      />
      <FormFooter state={state} pending={pending} label="Change password" />
    </form>
  );
}
