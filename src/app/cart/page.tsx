import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LineControls } from "@/components/cart/line-controls";
import { RemoveUnavailableButton } from "@/components/cart/remove-unavailable-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { requireShopper } from "@/server/auth/shopper-cookie";
import { getCart, type CartView } from "@/server/cart";

export const metadata: Metadata = { title: "Cart" };

const EMPTY: CartView = { lines: [], totalCents: 0, count: 0, hasUnavailable: false };

export default async function Page() {
  const shopper = await requireShopper();
  // A Guest who never added anything has no cid, so no key.
  const cart = shopper.ownerKey ? await getCart(shopper.ownerKey) : EMPTY;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Cart</h1>
      {cart.lines.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <Link href="/menu" className={buttonVariants({ variant: "outline" })}>
            Browse the menu
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y">
            {cart.lines.map((line, index) => (
              <li key={line.dishId} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
                <Image
                  src={"/images/" + line.imageSmall}
                  alt={line.name}
                  width={96}
                  height={72}
                  unoptimized
                  loading={index === 0 ? "eager" : "lazy"}
                  className="h-18 w-24 shrink-0 rounded-md object-cover"
                />
                <div className={`min-w-0 flex-1 basis-40 ${line.unavailable ? "opacity-60" : ""}`}>
                  <p className="font-medium">{line.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPrice(line.priceCents)}</p>
                </div>
                <LineControls line={line} />
                {line.unavailable ? (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Unavailable</span>
                ) : (
                  <span className="min-w-16 text-right font-semibold">
                    {formatPrice(line.lineTotalCents)}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-lg font-semibold">
              Total <span className="text-primary">{formatPrice(cart.totalCents)}</span>
            </p>
            {cart.hasUnavailable ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled aria-describedby="checkout-blocked">
                  Checkout
                </Button>
                <p id="checkout-blocked" className="text-sm text-muted-foreground">
                  Remove unavailable items to check out.
                </p>
                <RemoveUnavailableButton />
              </div>
            ) : (
              <Link href="/checkout" className={buttonVariants()}>
                Checkout
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
