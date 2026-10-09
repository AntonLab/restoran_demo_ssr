"use client";

import { useActionState, useState } from "react";
import { complaintAction, type ComplaintFormState } from "@/app/feedback/actions";
import { ContactInput, CountedTextarea } from "@/components/feedback/field";
import { Honeypot } from "@/components/feedback/honeypot";
import { Button } from "@/components/ui/button";

const idle: ComplaintFormState = { status: "idle" };

export function ComplaintForm() {
  const [state, action, pending] = useActionState(complaintAction, idle);
  const [text, setText] = useState("");
  const [contact, setContact] = useState("");

  if (state.status === "success") {
    return (
      <output className="block">
        {state.number
          ? `Complaint received. Your number is #${state.number}.`
          : "Complaint received."}
      </output>
    );
  }
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="relative flex flex-col gap-4">
      <CountedTextarea
        id="complaint-text"
        name="text"
        label="Reason"
        required
        value={text}
        onChange={setText}
        error={errors.text?.[0]}
      />
      <ContactInput
        id="complaint-contact"
        name="contact"
        label="Phone or email"
        required
        value={contact}
        onChange={setContact}
        error={errors.contact?.[0]}
      />
      <Honeypot />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Send complaint"}
      </Button>
    </form>
  );
}
