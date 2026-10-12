import Link from "next/link";
import { cn } from "@/lib/utils";

export function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <li>
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
}
