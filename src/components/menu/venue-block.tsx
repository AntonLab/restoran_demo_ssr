import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { telHref } from "@/lib/format";
import { formatHours, getTodayHours } from "@/lib/hours";
import type { SettingsData } from "@/server/queries/settings";

export function VenueBlock({ settings }: { settings: SettingsData }) {
  return (
    <section
      aria-label="Venue"
      className="bg-card flex flex-col gap-2 rounded-xl border border-border p-4 text-sm"
    >
      <p>
        <span className="font-medium">Today:</span>{" "}
        {formatHours(getTodayHours(settings.schedule, settings.timezone))}
      </p>
      <p>{settings.address}</p>
      <a
        href={telHref(settings.contacts.phone)}
        className="text-primary w-fit rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {settings.contacts.phone}
      </a>
      <Link href="/feedback" className={buttonVariants({ variant: "outline" })}>
        Leave feedback
      </Link>
    </section>
  );
}
