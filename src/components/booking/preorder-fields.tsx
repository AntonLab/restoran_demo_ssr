"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/site/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPrice } from "@/lib/format";
import type { CartView } from "@/server/cart";

export function PreorderFields({
  cart,
  checked,
  onChange,
}: {
  cart: CartView | null;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  if (cart === null || cart.lines.length === 0) return null;
  const unavailable = cart.lines.filter((l) => l.unavailable).map((l) => l.name);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id="booking-preorder"
          name="preorder"
          checked={checked}
          onCheckedChange={onChange}
        />
        <label htmlFor="booking-preorder" className="text-sm">
          Include my cart as pre-order
        </label>
      </div>
      {checked && (
        <>
          <ul className="flex flex-col gap-1 text-sm">
            {cart.lines.map((line) => (
              <li key={line.dishId} className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  {line.qty}× {line.name}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {line.unavailable && <StatusBadge>Unavailable</StatusBadge>}
                  {formatPrice(line.lineTotalCents)}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(cart.totalCents)}</span>
          </p>
          <input type="hidden" name="expectedTotalCents" value={cart.totalCents} />
          {cart.hasUnavailable && (
            <p role="alert" className="text-sm text-destructive">
              Remove unavailable items to pre-order: {unavailable.join(", ")}.
            </p>
          )}
          <div className="flex items-center gap-3">
            <Link href="/cart" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Edit cart
            </Link>
            <span className="text-sm text-muted-foreground">Pay at the venue</span>
          </div>
        </>
      )}
    </div>
  );
}
