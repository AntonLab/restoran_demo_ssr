import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { parseOrderNumber } from "@/lib/order-number";
import { getSession } from "@/server/auth/session";
import { getOrderConfirmation } from "@/server/orders";

export const metadata: Metadata = { title: "Order placed", robots: { index: false } };

export default async function Page({ searchParams }: PageProps<"/checkout/done">) {
  const number = parseOrderNumber((await searchParams).number);
  if (number === null) notFound();

  const session = await getSession();
  const userId = session?.user.role === "user" ? session.user.id : null;
  const order = await getOrderConfirmation(number, userId);
  if (!order) notFound();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-10">
      <h1 className="text-4xl font-bold">Thank you for your order</h1>
      <p className="text-2xl font-semibold">Order #{order.number}</p>
      <p className="text-xl">Total {formatPrice(order.totalCents)}</p>
      <p className="text-muted-foreground">
        Keep your order number. Delivery details are not shown on this page.
      </p>
      <div className="flex flex-wrap gap-3">
        {order.mine && (
          <Link href="/account/orders" className={buttonVariants()}>
            View in order history
          </Link>
        )}
        <Link href="/menu" className={buttonVariants({ variant: "outline" })}>
          Back to the menu
        </Link>
      </div>
    </div>
  );
}
