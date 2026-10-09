"use client";

import { useActionState, useState } from "react";
import { reviewAction, type ReviewFormState } from "@/app/feedback/actions";
import { Honeypot } from "@/components/feedback/honeypot";
import { StarInput } from "@/components/feedback/star-input";
import { Button } from "@/components/ui/button";

const idle: ReviewFormState = { status: "idle" };
const field =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function ReviewForm() {
  const [state, action, pending] = useActionState(reviewAction, idle);
  const [dishes, setDishes] = useState(0);
  const [service, setService] = useState(0);
  const [text, setText] = useState("");
  // Controlled: React 19 resets the form after the action, which would wipe it on any error.
  const [contact, setContact] = useState("");

  if (state.status === "success") {
    return <output className="block">Thanks, your review will appear after moderation.</output>;
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
        <span className="text-sm font-medium">Dishes</span>
        <StarInput name="dishesRating" label="Dishes" value={dishes} onChange={setDishes} />
        {err("dishesRating")}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Service</span>
        <StarInput name="serviceRating" label="Service" value={service} onChange={setService} />
        {err("serviceRating")}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="review-text" className="text-sm font-medium">
          Your review
        </label>
        <textarea
          id="review-text"
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
        <label htmlFor="review-contact" className="text-sm font-medium">
          Phone or email (optional)
        </label>
        <input
          id="review-contact"
          name="contact"
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
      <Button type="submit" disabled={pending || !dishes || !service} className="self-start">
        {pending ? "Sending…" : "Send review"}
      </Button>
    </form>
  );
}
