export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type ScheduleDay = { day: Weekday; open: string; close: string; closed: boolean };
