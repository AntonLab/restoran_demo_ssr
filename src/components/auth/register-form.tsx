"use client";

import { useActionState, useState } from "react";
import { type AuthFormState, registerAction } from "@/app/(auth)/actions";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";

const idle: AuthFormState = { status: "idle" };

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(registerAction, idle);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <AuthField
        id="register-email"
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
        id="register-password"
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={setPassword}
        error={errors.password?.[0]}
      />
      <AuthField
        id="register-name"
        name="name"
        label="Name"
        autoComplete="name"
        required
        value={name}
        onChange={setName}
        error={errors.name?.[0]}
      />
      <AuthField
        id="register-phone"
        name="phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        required
        value={phone}
        onChange={setPhone}
        error={errors.phone?.[0]}
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Please wait…" : "Create account"}
      </Button>
    </form>
  );
}
