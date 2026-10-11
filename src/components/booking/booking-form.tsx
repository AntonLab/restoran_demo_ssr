"use client";

import { useActionState, useState } from "react";
import { bookingAction, type BookingFormState } from "@/app/booking/actions";
import { AuthField } from "@/components/auth/auth-field";
import { PreorderFields } from "@/components/booking/preorder-fields";
import { SlotFields } from "@/components/booking/slot-fields";
import { Button } from "@/components/ui/button";
import type { BookingDay } from "@/lib/booking-slots";
import type { CartView } from "@/server/cart";

const idle: BookingFormState = { status: "idle" };

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
  const [name, setName] = useState(defaults.name);
  const [phone, setPhone] = useState(defaults.phone);
  const [guests, setGuests] = useState("2");
  const [preorder, setPreorder] = useState(
    preorderDefault && cart !== null && cart.lines.length > 0,
  );
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-4">
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
      <SlotFields days={days} error={errors.time?.[0] ?? errors.date?.[0]} />
      <PreorderFields cart={cart} checked={preorder} onChange={setPreorder} />
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
