import type { Metadata } from "next";
import { BookingForm } from "@/components/booking/booking-form";
import { bookingOptions } from "@/lib/booking-slots";
import { getSession } from "@/server/auth/session";
import { requireShopper } from "@/server/auth/shopper-cookie";
import { listActiveStarts } from "@/server/bookings";
import { getCart } from "@/server/cart";
import { getSettings } from "@/server/queries/settings";

export const metadata: Metadata = { title: "Reserve a table" };

export default async function Page({ searchParams }: PageProps<"/booking">) {
  const shopper = await requireShopper();
  // Async Server Component runs once per request, so the purity rule does not apply.
  // oxlint-disable-next-line react/purity
  const now = new Date();
  // The form lists only free Slots, but the server re-checks under the mutex,
  // so a stale form gets a field error instead of an overbooking.
  const [settings, session, active] = await Promise.all([
    getSettings(),
    getSession(),
    listActiveStarts(now),
  ]);
  const days = bookingOptions(
    settings.schedule,
    settings.timezone,
    active,
    now,
    settings.maxConcurrentBookings,
  );
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
