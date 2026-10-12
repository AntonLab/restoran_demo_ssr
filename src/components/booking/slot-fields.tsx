"use client";

import { DayTimeFields, type DayTimePick } from "@/components/day-time-fields";
import type { BookingDay } from "@/lib/booking-slots";

export type SlotPick = DayTimePick;

export function SlotFields({
  days,
  pick,
  onPick,
  error,
}: {
  days: BookingDay[];
  pick: SlotPick;
  onPick: (pick: SlotPick) => void;
  error?: string;
}) {
  if (days.length === 0) {
    return (
      <p role="alert" className="text-sm text-destructive">
        No free times in the next 30 days
      </p>
    );
  }

  return (
    <DayTimeFields
      days={days}
      pick={pick}
      onPick={onPick}
      error={error}
      idPrefix="booking"
      dateName="date"
      timeName="time"
      dateLabel="Day"
      timeLabel="Time"
    />
  );
}
