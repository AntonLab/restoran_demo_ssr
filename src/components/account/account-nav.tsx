"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_NAV } from "@/config/nav";
import { isNavActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account">
      <ul className="flex gap-4 text-sm">
        {ACCOUNT_NAV.map(({ label, href }) => {
          // "/account" would prefix-match its sub-pages, so Details matches exactly.
          const active = href === "/account" ? pathname === href : isNavActive(pathname, href);
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
  );
}
