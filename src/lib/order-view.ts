import { serializeOrderFilters, type OrderFilters } from "@/lib/order-schemas";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/order-status";

export function cancelFailureText(error: string, status?: OrderStatus): string {
  if (!status) return error;
  return `${error.replace(/\.$/, "")}. Current status: ${ORDER_STATUS_LABELS[status]}.`;
}

const BASE = "/account/orders";

export function formatItems(items: { name: string; qty: number }[]): string {
  return items.map((i) => `${i.qty}× ${i.name}`).join(", ");
}

export function hasOrderFilters(f: OrderFilters): boolean {
  return Boolean(f.from || f.to || f.status || f.dish);
}

export function pageHrefs(
  f: OrderFilters,
  pageCount: number,
): { prev: string | null; next: string | null } {
  const href = (page: number) => {
    const query = serializeOrderFilters({ ...f, page });
    return query ? `${BASE}?${query}` : BASE;
  };
  return {
    prev: f.page > 1 ? href(Math.min(f.page - 1, pageCount)) : null,
    next: f.page < pageCount ? href(f.page + 1) : null,
  };
}
