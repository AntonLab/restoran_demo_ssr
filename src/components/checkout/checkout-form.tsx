"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { checkoutAction, type CheckoutFormState } from "@/app/checkout/actions";
import { AuthField } from "@/components/auth/auth-field";
import { DeliveryFields } from "@/components/checkout/delivery-fields";
import { ContactInput } from "@/components/feedback/field";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { DeliveryDay } from "@/lib/delivery-time";
import type { Contact } from "@/lib/order-schemas";

const idle: CheckoutFormState = { status: "idle" };

export function CheckoutForm({
  totalCents,
  days,
  defaults,
}: {
  totalCents: number;
  days: DeliveryDay[];
  defaults: Contact;
}) {
  const [state, action, pending] = useActionState(checkoutAction, idle);
  const [name, setName] = useState(defaults.name);
  const [phone, setPhone] = useState(defaults.phone);
  const [address, setAddress] = useState(defaults.address);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="expectedTotalCents" value={totalCents} />
      <AuthField
        id="checkout-name"
        name="name"
        label="Name"
        autoComplete="name"
        required
        value={name}
        onChange={setName}
        error={errors.name?.[0]}
      />
      <AuthField
        id="checkout-phone"
        name="phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        required
        value={phone}
        onChange={setPhone}
        error={errors.phone?.[0]}
      />
      <ContactInput
        id="checkout-address"
        name="address"
        label="Delivery address"
        required
        value={address}
        onChange={setAddress}
        error={errors.address?.[0]}
      />
      <DeliveryFields days={days} error={errors.deliveryTime?.[0] ?? errors.deliveryDate?.[0]} />
      <p className="flex justify-between text-lg font-semibold">
        <span>Total</span>
        <span>{formatPrice(totalCents)}</span>
      </p>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || days.length === 0}>
          {pending ? "Placing order…" : "Place order"}
        </Button>
        <Link href="/cart" className={buttonVariants({ variant: "outline" })}>
          Back to cart
        </Link>
      </div>
    </form>
  );
}
