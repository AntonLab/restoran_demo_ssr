"use client";

import { useActionState, useState } from "react";
import { type AuthFormState, resetPasswordAction } from "@/app/(auth)/actions";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";

const idle: AuthFormState = { status: "idle" };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, idle);
  const [password, setPassword] = useState("");
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <AuthField
        id="reset-password"
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={setPassword}
        error={errors.password?.[0]}
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Please wait…" : "Change password"}
      </Button>
    </form>
  );
}
