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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <UtensilsCrossed className="text-primary size-5" aria-hidden="true" />
          <span>{siteName}</span>
        </Link>
        <nav aria-label="Main">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {NAV_ITEMS.map(({ label, href }) => {
              const active = isNavActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "hover:text-primary py-1 transition-colors",
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
