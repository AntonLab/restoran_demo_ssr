import Link from "next/link";
import type { BookingTab } from "@/lib/booking-schemas";
import { bookingTabHref } from "@/lib/booking-view";
import { cn } from "@/lib/utils";

const TABS: { tab: BookingTab; label: string }[] = [
  { tab: "upcoming", label: "Upcoming" },
  { tab: "past", label: "Past" },
];

export function BookingTabs({ tab }: { tab: BookingTab }) {
  return (
    <nav aria-label="Bookings">
      <ul className="flex gap-4 text-sm">
        {TABS.map((t) => (
          <li key={t.tab}>
            <Link
              href={bookingTabHref(t.tab)}
              aria-current={t.tab === tab ? "page" : undefined}
              className={cn(
                "hover:text-primary rounded-sm py-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                t.tab === tab ? "text-primary font-semibold" : "text-foreground",
              )}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
