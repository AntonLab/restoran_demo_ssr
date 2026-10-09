"use client";

import { useActionState, useState } from "react";
import { type AccountFormState, passwordAction } from "@/app/account/actions";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";

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
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-4">
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
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.status === "success" && <output className="block text-sm">{state.message}</output>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
