"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { serializeOrderFilters, type OrderFilters } from "@/lib/order-schemas";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/order-status";

const field =
  "border-input bg-background w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

const STATUS_ITEMS = [
  { value: "all", label: "All statuses" },
  ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] })),
];

export function OrderFiltersForm({ filters }: { filters: OrderFilters }) {
  const router = useRouter();

  return (
    <form
      key={serializeOrderFilters(filters)}
      method="get"
      action="/account/orders"
      // A plain GET submit sends empty fields and `status=all`; rebuild the URL without them.
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        for (const [k, v] of new FormData(e.currentTarget))
          if (v !== "" && !(k === "status" && v === "all")) params.set(k, String(v));
        const query = params.toString();
        router.push(query ? `/account/orders?${query}` : "/account/orders");
      }}
      className="my-6 flex flex-col gap-3"
    >
      <fieldset className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <legend className="sr-only">Filter orders</legend>
        <div className="flex flex-col gap-1">
          <label htmlFor="orders-from" className="text-sm font-medium">
            From
          </label>
          <input
            id="orders-from"
            name="from"
            type="date"
            defaultValue={filters.from ?? ""}
            className={field}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="orders-to" className="text-sm font-medium">
            To
          </label>
          <input
            id="orders-to"
            name="to"
            type="date"
            defaultValue={filters.to ?? ""}
            className={field}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span id="orders-status-label" className="text-sm font-medium">
            Status
          </span>
          <Select name="status" items={STATUS_ITEMS} defaultValue={filters.status ?? "all"}>
            <SelectTrigger aria-labelledby="orders-status-label" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="orders-dish" className="text-sm font-medium">
            Dish
          </label>
          <input
            id="orders-dish"
            name="dish"
            type="search"
            maxLength={80}
            defaultValue={filters.dish}
            className={field}
          />
        </div>
      </fieldset>
      <div className="flex gap-2">
        <Button type="submit">Apply</Button>
        <Link href="/account/orders" className={buttonVariants({ variant: "outline" })}>
          Reset
        </Link>
      </div>
    </form>
  );
}
