"use client";

import { FieldError } from "@/components/feedback/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pickTime } from "@/lib/delivery-pick";

const labelClass = "text-sm font-medium";

export type DayTimePick = { date: string; time: string };

export function DayTimeFields({
  days,
  pick: { date, time },
  onPick: setPick,
  error,
  idPrefix,
  dateName,
  timeName,
  dateLabel,
  timeLabel,
}: {
  days: readonly { date: string; label: string; times: readonly string[] }[];
  pick: DayTimePick;
  onPick: (pick: DayTimePick) => void;
  error?: string;
  idPrefix: string;
  dateName: string;
  timeName: string;
  dateLabel: string;
  timeLabel: string;
}) {
  const dayItems = days.map((d) => ({ value: d.date, label: d.label }));
  const times = days.find((d) => d.date === date)?.times ?? [];
  const timeItems = times.map((t) => ({ value: t, label: t }));

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span id={`${idPrefix}-date-label`} className={labelClass}>
            {dateLabel}
          </span>
          <Select
            name={dateName}
            items={dayItems}
            value={date}
            onValueChange={(next) => {
              if (next === null) return;
              const day = days.find((d) => d.date === next);
              setPick({ date: next, time: pickTime(day?.times ?? [], time) });
            }}
          >
            <SelectTrigger aria-labelledby={`${idPrefix}-date-label`} className="w-full">
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
          <span id={`${idPrefix}-time-label`} className={labelClass}>
            {timeLabel}
          </span>
          <Select
            name={timeName}
            items={timeItems}
            value={time}
            onValueChange={(next) => next !== null && setPick({ date, time: next })}
          >
            <SelectTrigger
              aria-labelledby={`${idPrefix}-time-label`}
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
