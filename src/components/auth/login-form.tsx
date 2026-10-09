"use client";

import { useActionState, useState } from "react";
import { type AuthFormState, loginAction } from "@/app/(auth)/actions";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";

const idle: AuthFormState = { status: "idle" };

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, idle);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <AuthField
        id="login-email"
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
        id="login-password"
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
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
        {pending ? "Please wait…" : "Sign in"}
      </Button>
    </form>
  );
}
