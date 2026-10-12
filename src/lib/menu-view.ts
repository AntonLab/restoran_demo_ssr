import type { MenuSort } from "@/lib/menu-params";

export const sectionAnchor = (key: string) => `section-${key}`;

export const SORT_LABELS: Record<MenuSort, string> = {
  order: "Menu order",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  popular: "Most popular",
};
