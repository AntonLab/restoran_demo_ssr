"use client";

import { useState } from "react";
import { FieldError } from "@/components/feedback/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BookingDay } from "@/lib/booking-slots";
import { initialDelivery, pickTime } from "@/lib/delivery-pick";

const labelClass = "text-sm font-medium";

export function SlotFields({ days, error }: { days: BookingDay[]; error?: string }) {
  const [{ date, time }, setPick] = useState(() => initialDelivery(days));

  if (days.length === 0) {
    return (
      <p role="alert" className="text-sm text-destructive">
        No free times in the next 30 days
      </p>
    );
  }

  const dayItems = days.map((d) => ({ value: d.date, label: d.label }));
  const times = days.find((d) => d.date === date)?.times ?? [];
  const timeItems = times.map((t) => ({ value: t, label: t }));

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span id="booking-date-label" className={labelClass}>
            Day
          </span>
          <Select
            name="date"
            items={dayItems}
            value={date}
            onValueChange={(next) => {
              if (next === null) return;
              const day = days.find((d) => d.date === next);
              setPick({ date: next, time: pickTime(day?.times ?? [], time) });
            }}
          >
            <SelectTrigger aria-labelledby="booking-date-label" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dayItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span id="booking-time-label" className={labelClass}>
            Time
          </span>
          <Select
            name="time"
            items={timeItems}
            value={time}
            onValueChange={(next) => next !== null && setPick({ date, time: next })}
          >
            <SelectTrigger
              aria-labelledby="booking-time-label"
              aria-invalid={Boolean(error)}
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <FieldError message={error} />
    </div>
  );
}
