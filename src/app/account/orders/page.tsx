import type { Metadata } from "next";
import { AccountList } from "@/components/account/account-list";
import { OrderFiltersForm } from "@/components/account/order-filters";
import { OrdersTable } from "@/components/account/orders-table";
import { pageHrefs } from "@/lib/list-view";
import { parseOrderFilters, serializeOrderFilters } from "@/lib/order-schemas";
import { hasOrderFilters } from "@/lib/order-view";
import { requireUser } from "@/server/auth/guards";
import { getSettings } from "@/server/queries/settings";
import { listUserOrders } from "@/server/orders";

export const metadata: Metadata = { title: "Orders" };

export default async function Page({ searchParams }: PageProps<"/account/orders">) {
  const session = await requireUser("/account/orders");
  const filters = parseOrderFilters(await searchParams);
  const settings = await getSettings();
  const result = await listUserOrders(session.user.id, filters, settings.timezone);
  const { prev, next } = pageHrefs(
    filters,
    result.pageCount,
    "/account/orders",
    serializeOrderFilters,
  );

  return (
    <AccountList
      toolbar={<OrderFiltersForm filters={filters} />}
      noun="orders"
      empty={
        hasOrderFilters(filters)
          ? {
              title: "No orders match these filters",
              href: "/account/orders",
              label: "Reset filters",
            }
          : { title: "No orders yet", href: "/menu", label: "Browse the menu" }
      }
      total={result.total}
      shown={result.orders.length}
      page={result.page}
      pageCount={result.pageCount}
      prev={prev ?? undefined}
      next={next ?? undefined}
    >
      <OrdersTable orders={result.orders} timezone={settings.timezone} />
    </AccountList>
  );
}
