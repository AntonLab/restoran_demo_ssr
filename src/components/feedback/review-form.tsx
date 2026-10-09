"use client";

import { useActionState, useState } from "react";
import { reviewAction, type ReviewFormState } from "@/app/feedback/actions";
import { ContactInput, CountedTextarea, FieldError } from "@/components/feedback/field";
import { Honeypot } from "@/components/feedback/honeypot";
import { StarInput } from "@/components/feedback/star-input";
import { Button } from "@/components/ui/button";

const idle: ReviewFormState = { status: "idle" };

export function ReviewForm() {
  const [state, action, pending] = useActionState(reviewAction, idle);
  const [dishes, setDishes] = useState(0);
  const [service, setService] = useState(0);
  const [text, setText] = useState("");
  const [contact, setContact] = useState("");

  if (state.status === "success") {
    return <output className="block">Thanks, your review will appear after moderation.</output>;
  }
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="relative flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Dishes</span>
        <StarInput name="dishesRating" label="Dishes" value={dishes} onChange={setDishes} />
        <FieldError message={errors.dishesRating?.[0]} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Service</span>
        <StarInput name="serviceRating" label="Service" value={service} onChange={setService} />
        <FieldError message={errors.serviceRating?.[0]} />
      </div>
      <CountedTextarea
        id="review-text"
        name="text"
        label="Your review"
        required
        value={text}
        onChange={setText}
        error={errors.text?.[0]}
      />
      <ContactInput
        id="review-contact"
        name="contact"
        label="Phone or email (optional)"
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
      <Button type="submit" disabled={pending || !dishes || !service} className="self-start">
        {pending ? "Sending…" : "Send review"}
      </Button>
    </form>
  );
}
