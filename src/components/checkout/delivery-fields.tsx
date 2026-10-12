"use client";

import { useState } from "react";
import { DayTimeFields } from "@/components/day-time-fields";
import { initialDelivery } from "@/lib/delivery-pick";
import type { DeliveryDay } from "@/lib/delivery-time";

export function DeliveryFields({ days, error }: { days: DeliveryDay[]; error?: string }) {
  const [pick, setPick] = useState(() => initialDelivery(days));

  if (days.length === 0) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Delivery is not available this week.
      </p>
    );
  }

  return (
    <DayTimeFields
      days={days}
      pick={pick}
      onPick={setPick}
      error={error}
      idPrefix="delivery"
      dateName="deliveryDate"
      timeName="deliveryTime"
      dateLabel="Delivery day"
      timeLabel="Delivery time"
    />
  );
}
