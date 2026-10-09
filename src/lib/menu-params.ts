export const MENU_SORTS = ["order", "price-asc", "price-desc", "popular"] as const;
export type MenuSort = (typeof MENU_SORTS)[number];

export type MenuFilters = {
  q: string;
  minCents: number | null;
  maxCents: number | null;
  inStock: boolean;
  sort: MenuSort;
};

export const DEFAULT_MENU_FILTERS: MenuFilters = {
  q: "",
  minCents: null,
  maxCents: null,
  inStock: false,
  sort: "order",
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Number("") is 0, so an empty value must be rejected before conversion.
function toCents(v: string | string[] | undefined): number | null {
  const s = first(v)?.trim();
  if (!s) return null;
  const n = Number(s);
  if (!(n >= 0)) return null;
  // Finite input like "1e307" overflows to Infinity after * 100.
  const cents = Math.round(n * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function parseMenuParams(sp: SearchParams): MenuFilters {
  let minCents = toCents(sp.min);
  let maxCents = toCents(sp.max);
  if (minCents !== null && maxCents !== null && minCents > maxCents) {
    [minCents, maxCents] = [maxCents, minCents];
  }
  const sort = first(sp.sort);
  return {
    q: (first(sp.q) ?? "").trim().slice(0, 100),
    minCents,
    maxCents,
    inStock: first(sp.stock) === "1",
    sort: MENU_SORTS.find((s) => s === sort) ?? "order",
  };
}

export function serializeMenuParams(f: MenuFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.minCents !== null) p.set("min", String(f.minCents / 100));
  if (f.maxCents !== null) p.set("max", String(f.maxCents / 100));
  if (f.inStock) p.set("stock", "1");
  if (f.sort !== DEFAULT_MENU_FILTERS.sort) p.set("sort", f.sort);
  return p.toString();
}

export function hasActiveFilters(f: MenuFilters): boolean {
  return f.q !== "" || f.minCents !== null || f.maxCents !== null || f.inStock;
}
