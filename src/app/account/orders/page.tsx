import type { Metadata } from "next";
import Link from "next/link";
import { AccountNav } from "@/components/account/account-nav";
import { OrderFiltersForm } from "@/components/account/order-filters";
import { OrdersTable } from "@/components/account/orders-table";
import { buttonVariants } from "@/components/ui/button";
import { parseOrderFilters } from "@/lib/order-schemas";
import { hasOrderFilters, pageHrefs } from "@/lib/order-view";
import { requireUser } from "@/server/auth/guards";
import { getSettings } from "@/server/queries/settings";
import { listUserOrders } from "@/server/orders";

export const metadata: Metadata = { title: "Orders" };

export default async function Page({ searchParams }: PageProps<"/account/orders">) {
  const session = await requireUser("/account/orders");
  const filters = parseOrderFilters(await searchParams);
  const settings = await getSettings();
  const result = await listUserOrders(session.user.id, filters, settings.timezone);
  const { prev, next } = pageHrefs(filters, result.pageCount);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Account</h1>
      <AccountNav />
      <OrderFiltersForm filters={filters} />
      {result.total === 0 ? (
        hasOrderFilters(filters) ? (
          <div className="flex flex-col items-start gap-3">
            <h2 className="text-xl font-semibold">No orders match these filters</h2>
            <Link href="/account/orders" className={buttonVariants({ variant: "outline" })}>
              Reset filters
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <h2 className="text-xl font-semibold">No orders yet</h2>
            <Link href="/menu" className={buttonVariants({ variant: "outline" })}>
              Browse the menu
            </Link>
          </div>
        )
      ) : result.orders.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <h2 className="text-xl font-semibold">No orders on this page</h2>
          {prev && (
            <Link href={prev} className={buttonVariants({ variant: "outline" })}>
              Back to the last page
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <OrdersTable orders={result.orders} timezone={settings.timezone} />
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
