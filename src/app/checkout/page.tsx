import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { deliveryOptions } from "@/lib/delivery-time";
import { requireShopper } from "@/server/auth/shopper-cookie";
import { getSession } from "@/server/auth/session";
import { getCart } from "@/server/cart";
import { getSettings } from "@/server/queries/settings";

export const metadata: Metadata = { title: "Checkout" };

export default async function Page() {
  const shopper = await requireShopper();
  const cart = shopper.ownerKey ? await getCart(shopper.ownerKey) : null;
  if (!cart || cart.lines.length === 0 || cart.hasUnavailable) redirect("/cart");

  const [settings, session] = await Promise.all([getSettings(), getSession()]);
  const days = deliveryOptions(settings.schedule, settings.timezone);
  const defaults = {
    name: session?.user.name ?? "",
    phone: session?.user.phone ?? "",
    address: "",
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <CheckoutForm totalCents={cart.totalCents} days={days} defaults={defaults} />
    </div>
  );
}
