"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "@/components/site/nav-link";
import { ACCOUNT_NAV } from "@/config/nav";
import { isNavActive } from "@/lib/nav";

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {ACCOUNT_NAV.map(({ label, href }) => {
          // "/account" would prefix-match its sub-pages, so Details matches exactly.
          const active = href === "/account" ? pathname === href : isNavActive(pathname, href);
          return <NavLink key={href} href={href} label={label} active={active} />;
        })}
      </ul>
    </nav>
  );
}
