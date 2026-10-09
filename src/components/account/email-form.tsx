"use client";

import { useActionState, useState } from "react";
import { type AccountFormState, emailAction } from "@/app/account/actions";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";

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
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-4">
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
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.status === "success" && <output className="block text-sm">{state.message}</output>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Change email"}
      </Button>
    </form>
  );
}
