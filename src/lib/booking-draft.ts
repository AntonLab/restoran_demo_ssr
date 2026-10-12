import { z } from "zod";
import type { BookingDay } from "@/lib/booking-slots";

const KEY = "booking-draft";

const draftSchema = z.object({
  name: z.string(),
  phone: z.string(),
  guests: z.string(),
  date: z.string(),
  time: z.string(),
  preorder: z.boolean(),
});

export type BookingDraft = z.infer<typeof draftSchema>;

export function parseDraft(raw: string | null): BookingDraft | null {
  if (raw === null) return null;
  try {
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// A slot can vanish between visits: drop only the part that is gone, keep the rest.
export function restoreDraft(
  draft: BookingDraft,
  days: readonly BookingDay[],
): Partial<BookingDraft> {
  const { date, time, ...rest } = draft;
  const day = days.find((d) => d.date === date);
  if (!day) return rest;
  return day.times.includes(time) ? { ...rest, date, time } : { ...rest, date };
}

// Private mode and blocked storage throw; the form must work without a draft.
export function saveDraft(draft: BookingDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {}
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

// Does not remove: strict mode mounts the restore effect twice and the second read must
// still find the draft. A submit clears it (clearDraft) so a booked form is never restored.
export function readDraft(): BookingDraft | null {
  try {
    return parseDraft(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}
