"use client";

import { useActionState, useState } from "react";
import { type AccountFormState, contactsAction } from "@/app/account/actions";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";

const idle: AccountFormState = { status: "idle" };

export function ContactsForm({
  name: initialName,
  phone: initialPhone,
}: {
  name: string;
  phone: string;
}) {
  const [state, action, pending] = useActionState(contactsAction, idle);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-4">
      <AuthField
        id="account-name"
        name="name"
        label="Name"
        autoComplete="name"
        required
        value={name}
        onChange={setName}
        error={errors.name?.[0]}
      />
      <AuthField
        id="account-phone"
        name="phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={setPhone}
        error={errors.phone?.[0]}
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.status === "success" && <output className="block text-sm">{state.message}</output>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
