"use client";

import { useActionState, useEffect, useState } from "react";
import { templateAction } from "@/app/account/templates/actions";
import type { AccountFormState } from "@/app/account/form-state";
import { ContactInput } from "@/components/feedback/field";
import { Button } from "@/components/ui/button";
import type { TemplateView } from "@/lib/template-offer";

const idle: AccountFormState = { status: "idle" };

export function TemplateForm({
  template,
  onDone,
}: {
  template?: TemplateView;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(templateAction, idle);
  const [name, setName] = useState(template?.name ?? "");
  const [phone, setPhone] = useState(template?.phone ?? "");
  const [address, setAddress] = useState(template?.address ?? "");
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const id = template?.id ?? "new";

  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-lg border p-4">
      {template && <input type="hidden" name="id" value={template.id} />}
      <ContactInput
        id={`template-${id}-name`}
        name="name"
        label="Name"
        required
        value={name}
        onChange={setName}
        error={errors.name?.[0]}
      />
      <ContactInput
        id={`template-${id}-phone`}
        name="phone"
        label="Phone"
        required
        value={phone}
        onChange={setPhone}
        error={errors.phone?.[0]}
      />
      <ContactInput
        id={`template-${id}-address`}
        name="address"
        label="Address"
        required
        value={address}
        onChange={setAddress}
        error={errors.address?.[0]}
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save template"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
