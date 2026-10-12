import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTime, formatPrice } from "@/lib/format";
import { formatItems } from "@/lib/order-view";
import { parseOrderNumber } from "@/lib/order-number";
import { singleParam } from "@/lib/search-param";
import { getSession } from "@/server/auth/session";
import { getBookingConfirmation } from "@/server/bookings";
import { getSettings } from "@/server/queries/settings";

export const metadata: Metadata = { title: "Table reserved", robots: { index: false } };

export default async function Page({ searchParams }: PageProps<"/booking/done">) {
  const { number: rawNumber, t } = await searchParams;
  const number = parseOrderNumber(rawNumber);
  if (number === null) notFound();

  const session = await getSession();
  const userId = session?.user.role === "user" ? session.user.id : null;
  const [booking, settings] = await Promise.all([
    getBookingConfirmation(number, userId, singleParam(t)),
    getSettings(),
  ]);
  if (!booking) notFound();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-10">
      <h1 className="text-4xl font-bold">Your table is reserved</h1>
      <p className="text-2xl font-semibold">Booking #{booking.number}</p>
      <p className="text-xl">{formatDateTime(booking.startsAt, settings.timezone)}</p>
      <p>{booking.guests === 1 ? "1 guest" : `${booking.guests} guests`}</p>
      {booking.items.length > 0 && (
        <div className="flex flex-col gap-1">
          <p>{formatItems(booking.items)}</p>
          <p className="text-xl">Total {formatPrice(booking.totalCents)}</p>
          <p className="text-muted-foreground">Pay at the venue</p>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {booking.mine && (
          <Link href="/account/bookings" className={buttonVariants()}>
            View my bookings
          </Link>
        )}
        <Link href="/menu" className={buttonVariants({ variant: "outline" })}>
          Back to the menu
        </Link>
      </div>
    </div>
  );
}
