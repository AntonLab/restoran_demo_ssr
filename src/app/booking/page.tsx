import type { Metadata } from "next";
import { BookingForm } from "@/components/booking/booking-form";
import { getSession } from "@/server/auth/session";
import { requireShopper } from "@/server/auth/shopper-cookie";
import { loadBookingDays } from "@/server/bookings";
import { getCart } from "@/server/cart";

export const metadata: Metadata = { title: "Reserve a table" };

export default async function Page({ searchParams }: PageProps<"/booking">) {
  const shopper = await requireShopper();
  // The form lists only free Slots, but the server re-checks under the mutex,
  // so a stale form gets a field error instead of an overbooking.
  const [days, session] = await Promise.all([loadBookingDays(), getSession()]);
  const cartView = shopper.ownerKey ? await getCart(shopper.ownerKey) : null;
  const cart = cartView && cartView.lines.length > 0 ? cartView : null;
  const preorderDefault = (await searchParams).preorder === "1";
  const defaults = { name: session?.user.name ?? "", phone: session?.user.phone ?? "" };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-bold">Reserve a table</h1>
      <p className="text-muted-foreground">A booking lasts 2 hours.</p>
      <BookingForm days={days} defaults={defaults} cart={cart} preorderDefault={preorderDefault} />
    </div>
  );
}
