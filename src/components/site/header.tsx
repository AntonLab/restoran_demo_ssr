"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { NAV_ITEMS } from "@/config/nav";
import { isNavActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Header({ siteName }: { siteName: string }) {
  const pathname = usePathname();
  return (
    <header className="bg-background/95 border-border sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          aria-label={siteName}
          className="flex shrink-0 items-center gap-2 rounded-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <UtensilsCrossed className="text-primary size-5" aria-hidden="true" />
          <span className="hidden sm:inline">{siteName}</span>
        </Link>
        <nav aria-label="Main" className="min-w-0 overflow-x-auto">
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
      </div>
    </header>
  );
}
