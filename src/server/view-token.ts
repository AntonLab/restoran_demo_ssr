import { timingSafeEqual } from "node:crypto";

export function tokenMatches(stored: string | undefined, given: string | undefined): boolean {
  if (!stored || !given) return false;
  const a = Buffer.from(stored);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
