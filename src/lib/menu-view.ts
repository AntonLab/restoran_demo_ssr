import type { MenuSort } from "@/lib/menu-params";

export const sectionAnchor = (key: string) => `section-${key}`;

export function pickActiveSection(
  tops: { key: string; top: number }[],
  offset: number,
): string | undefined {
  let active = tops[0]?.key;
  for (const t of tops) if (t.top <= offset) active = t.key;
  return active;
}

export const SORT_LABELS: Record<MenuSort, string> = {
  order: "Menu order",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  popular: "Most popular",
};
