import type { OrderFilters } from "@/lib/order-schemas";

export function formatItems(items: { name: string; qty: number }[]): string {
  return items.map((i) => `${i.qty}× ${i.name}`).join(", ");
}

export function hasOrderFilters(f: OrderFilters): boolean {
  return Boolean(f.from || f.to || f.status || f.dish);
}
