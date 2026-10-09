"use client";

import { useActionState, useState } from "react";
import { type AuthFormState, forgotPasswordAction } from "@/app/(auth)/actions";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";

const idle: AuthFormState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, idle);
  const [email, setEmail] = useState("");

  if (state.status === "sent") {
    return (
      <output className="block">If an account exists for this email, we sent a reset link.</output>
    );
  }
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-4">
      <AuthField
        id="forgot-email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={setEmail}
        error={errors.email?.[0]}
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Please wait…" : "Send reset link"}
      </Button>
    </form>
  );
}
