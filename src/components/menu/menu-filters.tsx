"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { MENU_SORTS, serializeMenuParams, type MenuFilters as Filters } from "@/lib/menu-params";
import { SORT_LABELS } from "@/lib/menu-view";
import { cn } from "@/lib/utils";

const field =
  "border-input bg-background w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

const dollars = (cents: number | null) => (cents === null ? "" : String(cents / 100));

export function MenuFilters({ filters }: { filters: Filters }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        className="lg:hidden"
        aria-expanded={open}
        aria-controls="menu-filters"
        onClick={() => setOpen((o) => !o)}
      >
        Filters
      </Button>
      <form
        id="menu-filters"
        key={serializeMenuParams(filters)}
        method="get"
        action="/menu"
        className={cn("mt-3 flex flex-col gap-3 lg:mt-0", open ? "flex" : "hidden lg:flex")}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-q" className="text-sm font-medium">
            Search
          </label>
          <input
            id="filter-q"
            name="q"
            type="search"
            maxLength={100}
            defaultValue={filters.q}
            className={field}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-min" className="text-sm font-medium">
              Min price, $
            </label>
            <input
              id="filter-min"
              name="min"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              defaultValue={dollars(filters.minCents)}
              className={field}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-max" className="text-sm font-medium">
              Max price, $
            </label>
            <input
              id="filter-max"
              name="max"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              defaultValue={dollars(filters.maxCents)}
              className={field}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="stock"
            value="1"
            defaultChecked={filters.inStock}
            className="size-4 accent-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          In stock only
        </label>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-sort" className="text-sm font-medium">
            Sort by
          </label>
          <select id="filter-sort" name="sort" defaultValue={filters.sort} className={field}>
            {MENU_SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit">Apply</Button>
          <Link href="/menu" className={buttonVariants({ variant: "outline" })}>
            Reset
          </Link>
        </div>
      </form>
    </div>
  );
}
