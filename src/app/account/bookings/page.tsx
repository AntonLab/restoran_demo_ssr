import type { Metadata } from "next";
import { AccountList } from "@/components/account/account-list";
import { BookingTabs } from "@/components/account/booking-tabs";
import { BookingsTable } from "@/components/account/bookings-table";
import { parseBookingFilters, serializeBookingFilters } from "@/lib/booking-schemas";
import { pageHrefs } from "@/lib/list-view";
import { requireUser } from "@/server/auth/guards";
import { loadUserBookingsPage } from "@/server/bookings";
import { getSettings } from "@/server/queries/settings";

export const metadata: Metadata = { title: "Bookings" };

export default async function Page({ searchParams }: PageProps<"/account/bookings">) {
  const session = await requireUser("/account/bookings");
  const filters = parseBookingFilters(await searchParams);
  const settings = await getSettings();
  const result = await loadUserBookingsPage(session.user.id, filters);
  const { prev, next } = pageHrefs(
    filters,
    result.pageCount,
    "/account/bookings",
    serializeBookingFilters,
  );

  return (
    <AccountList
      toolbar={<BookingTabs tab={filters.tab} />}
      noun="bookings"
      empty={{ title: "No bookings yet", href: "/booking", label: "Reserve a table" }}
      total={result.total}
      shown={result.bookings.length}
      page={result.page}
      pageCount={result.pageCount}
      prev={prev ?? undefined}
      next={next ?? undefined}
    >
      <BookingsTable bookings={result.bookings} timezone={settings.timezone} />
    </AccountList>
  );
}
