import { cache } from "react";
import { connectDb } from "@/server/db";
import { Settings } from "@/server/models/settings";
import { DEFAULT_SETTINGS } from "@/server/settings-defaults";
import type { ScheduleDay } from "@/lib/weekdays";

export type SettingsData = {
  name: string;
  description: string;
  contacts: { phone: string; email: string };
  address: string;
  schedule: ScheduleDay[];
  socials: { label: string; url: string }[];
  timezone: string;
  maxConcurrentBookings: number;
};

// cache() dedupes the read within one request: layout and generateMetadata both call it.
export const getSettings = cache(async (): Promise<SettingsData> => {
  await connectDb();
  const s = await Settings.findOne().lean();
  if (!s) return DEFAULT_SETTINGS;
  return {
    name: s.name,
    description: s.description ?? "",
    contacts: { phone: s.contacts?.phone ?? "", email: s.contacts?.email ?? "" },
    address: s.address ?? "",
    schedule: s.schedule.map(({ day, open, close, closed }) => ({
      day: day as ScheduleDay["day"],
      open,
      close,
      closed: closed ?? false,
    })),
    socials: s.socials.map(({ label, url }) => ({ label, url })),
    timezone: s.timezone,
    maxConcurrentBookings: s.maxConcurrentBookings,
  };
});
