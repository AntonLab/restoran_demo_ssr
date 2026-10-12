import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { deliveryOptions } from "@/lib/delivery-time";
import type { TemplateView } from "@/lib/template-offer";
import { listTemplates, TEMPLATE_LIMIT } from "@/server/order-templates";
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
  const isUser = shopper.role === "user";
  const templates: TemplateView[] =
    isUser && shopper.userId
      ? (await listTemplates(shopper.userId)).map(({ id, name, phone, address }) => ({
          id,
          name,
          phone,
          address,
        }))
      : [];
  const defaults = templates[0] ?? {
    name: session?.user.name ?? "",
    phone: session?.user.phone ?? "",
    address: "",
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <CheckoutForm
        totalCents={cart.totalCents}
        days={days}
        defaults={defaults}
        templates={templates}
        isUser={isUser}
        atLimit={templates.length >= TEMPLATE_LIMIT}
      />
    </div>
  );
}
