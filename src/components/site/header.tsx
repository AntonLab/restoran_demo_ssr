"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { NAV_ITEMS } from "@/config/nav";
import { isNavActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Header({ siteName, auth }: { siteName: string; auth: ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="bg-background/95 border-border sticky top-0 z-40 border-b backdrop-blur">
      {/* Below sm the nav takes its own row: the admin header (nav + Cart + Admin + Sign out)
          is wider than 360 px, and a scrolling nav clipped "Leave feedback" under "Admin". */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0">
        <Link
          href="/"
          aria-label={siteName}
          className="flex shrink-0 items-center gap-2 rounded-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <UtensilsCrossed className="text-primary size-5" aria-hidden="true" />
          <span className="hidden sm:inline">{siteName}</span>
        </Link>
        <nav
          aria-label="Main"
          className="order-last w-full min-w-0 sm:order-none sm:w-auto sm:overflow-x-auto"
        >
          <ul className="flex items-center gap-x-4 px-1 py-1 text-sm whitespace-nowrap">
            {NAV_ITEMS.map(({ label, href }) => {
              const active = isNavActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "hover:text-primary rounded-sm py-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      active ? "text-primary font-semibold" : "text-foreground",
                    )}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex shrink-0 items-center gap-3 text-sm">{auth}</div>
      </div>
    </header>
  );
}
