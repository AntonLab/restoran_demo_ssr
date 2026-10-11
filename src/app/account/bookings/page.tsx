import type { Metadata } from "next";
import Link from "next/link";
import { AccountNav } from "@/components/account/account-nav";
import { BookingTabs } from "@/components/account/booking-tabs";
import { BookingsTable } from "@/components/account/bookings-table";
import { buttonVariants } from "@/components/ui/button";
import { parseBookingFilters } from "@/lib/booking-schemas";
import { bookingPageHrefs } from "@/lib/booking-view";
import { requireUser } from "@/server/auth/guards";
import { loadUserBookingsPage } from "@/server/bookings";
import { getSettings } from "@/server/queries/settings";

export const metadata: Metadata = { title: "Bookings" };

export default async function Page({ searchParams }: PageProps<"/account/bookings">) {
  const session = await requireUser("/account/bookings");
  const filters = parseBookingFilters(await searchParams);
  const settings = await getSettings();
  const result = await loadUserBookingsPage(session.user.id, filters);
  const { prev, next } = bookingPageHrefs(filters, result.pageCount);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Account</h1>
      <AccountNav />
      <BookingTabs tab={filters.tab} />
      {result.total === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <h2 className="text-xl font-semibold">No bookings yet</h2>
          <Link href="/booking" className={buttonVariants({ variant: "outline" })}>
            Reserve a table
          </Link>
        </div>
      ) : result.bookings.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <h2 className="text-xl font-semibold">No bookings on this page</h2>
          {prev && (
            <Link href={prev} className={buttonVariants({ variant: "outline" })}>
              Back to the last page
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <BookingsTable bookings={result.bookings} timezone={settings.timezone} />
          {result.pageCount > 1 && (
            <nav aria-label="Pages" className="flex items-center justify-between gap-2 text-sm">
              {prev ? (
                <Link href={prev} className={buttonVariants({ variant: "outline" })}>
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span>
                Page {result.page} of {result.pageCount}
              </span>
              {next ? (
                <Link href={next} className={buttonVariants({ variant: "outline" })}>
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
