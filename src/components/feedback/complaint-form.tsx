"use client";

import { useActionState, useState } from "react";
import { complaintAction, type ComplaintFormState } from "@/app/feedback/actions";
import { Honeypot } from "@/components/feedback/honeypot";
import { Button } from "@/components/ui/button";

const idle: ComplaintFormState = { status: "idle" };
const field =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function ComplaintForm() {
  const [state, action, pending] = useActionState(complaintAction, idle);
  const [text, setText] = useState("");
  // Controlled: React 19 resets the form after the action, which would wipe it on any error.
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
  const err = (name: string) =>
    errors[name]?.[0] && (
      <p role="alert" className="text-sm text-destructive">
        {errors[name][0]}
      </p>
    );

  return (
    <form action={action} className="relative flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="complaint-text" className="text-sm font-medium">
          Reason
        </label>
        <textarea
          id="complaint-text"
          name="text"
          rows={4}
          required
          maxLength={1000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={Boolean(errors.text)}
          className={field}
        />
        <span className="self-end text-xs text-muted-foreground">{text.length}/1000</span>
        {err("text")}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="complaint-contact" className="text-sm font-medium">
          Phone or email
        </label>
        <input
          id="complaint-contact"
          name="contact"
          required
          maxLength={200}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          aria-invalid={Boolean(errors.contact)}
          className={field}
        />
        {err("contact")}
      </div>
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
