import type { DeliveryDay } from "@/lib/delivery-time";

export function pickTime(times: readonly string[], current: string): string {
  return times.includes(current) ? current : (times[0] ?? "");
}

export function initialDelivery(days: readonly DeliveryDay[]): { date: string; time: string } {
  return { date: days[0]?.date ?? "", time: days[0]?.times[0] ?? "" };
}
