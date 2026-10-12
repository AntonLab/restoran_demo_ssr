"use client";

import { useFocusFirstError } from "@/components/use-focus-first-error";
import { useActionState, useEffect, useRef, useState } from "react";
import { bookingAction, type BookingFormState } from "@/app/booking/actions";
import { AuthField } from "@/components/auth/auth-field";
import { PreorderFields } from "@/components/booking/preorder-fields";
import { SlotFields } from "@/components/booking/slot-fields";
import { Button } from "@/components/ui/button";
import {
  type BookingDraft,
  clearDraft,
  readDraft,
  restoreDraft,
  saveDraft,
} from "@/lib/booking-draft";
import type { BookingDay } from "@/lib/booking-slots";
import { initialDelivery, pickTime } from "@/lib/delivery-pick";
import type { CartView } from "@/server/cart";

const idle: BookingFormState = { status: "idle" };
const DRAFT_DEBOUNCE_MS = 300;

export function BookingForm({
  days,
  defaults,
  cart,
  preorderDefault,
}: {
  days: BookingDay[];
  defaults: { name: string; phone: string };
  cart: CartView | null;
  preorderDefault: boolean;
}) {
  const [state, action, pending] = useActionState(bookingAction, idle);
  const formRef = useFocusFirstError(state);
  const [name, setName] = useState(defaults.name);
  const [phone, setPhone] = useState(defaults.phone);
  const [guests, setGuests] = useState("2");
  const [preorder, setPreorder] = useState(
    preorderDefault && cart !== null && cart.lines.length > 0,
  );
  const [pick, setPick] = useState(() => initialDelivery(days));
  const hasCart = cart !== null && cart.lines.length > 0;

  // Restored after hydration so the server render stays pure; sessionStorage
  // is an external system the server render cannot read. Runs once on mount:
  // the props are fixed for this page render.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      const restored = restoreDraft(draft, days);
      setName(restored.name ?? defaults.name);
      setPhone(restored.phone ?? defaults.phone);
      setGuests(restored.guests ?? "2");
      if (restored.date !== undefined) {
        const times = days.find((d) => d.date === restored.date)?.times ?? [];
        setPick({ date: restored.date, time: restored.time ?? pickTime(times, "") });
      }
      if (restored.preorder !== undefined && hasCart) setPreorder(restored.preorder);
    }
    setReady(true);
    // oxlint-disable-next-line react-hooks/exhaustive-deps, react/exhaustive-effect-dependencies
  }, []);

  // Debounced save covers every way of leaving the page. A pending submit clears the draft
  // so a booked form is never restored; a failed submit re-saves it. Not armed before the
  // restore ran: strict mode's mount-cleanup-mount would otherwise save the defaults.
  const unsaved = useRef<BookingDraft | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (pending) {
      unsaved.current = null;
      clearDraft();
      return;
    }
    const draft = { name, phone, guests, ...pick, preorder };
    unsaved.current = draft;
    const timer = setTimeout(() => {
      saveDraft(draft);
      unsaved.current = null;
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [ready, name, phone, guests, pick, preorder, pending]);

  // Flush an edit still inside the debounce window on leave.
  useEffect(() => {
    const flush = () => {
      if (unsaved.current) saveDraft(unsaved.current);
      unsaved.current = null;
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <AuthField
        id="booking-name"
        name="name"
        label="Name"
        autoComplete="name"
        required
        value={name}
        onChange={setName}
        error={errors.name?.[0]}
      />
      <AuthField
        id="booking-phone"
        name="phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        required
        value={phone}
        onChange={setPhone}
        error={errors.phone?.[0]}
      />
      <AuthField
        id="booking-guests"
        name="guests"
        label="Guests"
        inputMode="numeric"
        maxLength={2}
        required
        value={guests}
        onChange={setGuests}
        error={errors.guests?.[0]}
      />
      <SlotFields
        days={days}
        pick={pick}
        onPick={setPick}
        error={errors.time?.[0] ?? errors.date?.[0]}
      />
      <PreorderFields
        cart={cart}
        checked={preorder}
        onChange={setPreorder}
        onEditCart={() => saveDraft({ name, phone, guests, ...pick, preorder })}
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div>
        <Button
          type="submit"
          disabled={pending || days.length === 0 || (preorder && Boolean(cart?.hasUnavailable))}
        >
          {pending ? "Reserving…" : "Reserve a table"}
        </Button>
      </div>
    </form>
  );
}
