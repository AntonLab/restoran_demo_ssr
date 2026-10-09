import type { ScheduleDay } from "@/lib/weekdays";

const weekday = (day: ScheduleDay["day"]): ScheduleDay => ({
  day,
  open: "10:00",
  close: "22:00",
  closed: false,
});

export const DEFAULT_SETTINGS = {
  name: "Verde Kitchen",
  description: "Seasonal comfort food made from fresh local ingredients.",
  contacts: { phone: "+1 555 010 2030", email: "hello@verde-kitchen.example" },
  address: "123 Green Street, Springfield",
  schedule: [
    weekday("Mon"),
    weekday("Tue"),
    weekday("Wed"),
    weekday("Thu"),
    weekday("Fri"),
    weekday("Sat"),
    { day: "Sun", open: "11:00", close: "20:00", closed: false },
  ] as ScheduleDay[],
  socials: [
    { label: "Instagram", url: "https://example.com/verde-kitchen-instagram" },
    { label: "Facebook", url: "https://example.com/verde-kitchen-facebook" },
  ],
  timezone: "America/New_York",
  maxConcurrentBookings: 5,
};
