import { timingSafeEqual } from "node:crypto";

function tokenMatches(stored: string | undefined, given: string | undefined): boolean {
  if (!stored || !given) return false;
  const a = Buffer.from(stored);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

// The Number is guessable: a User sees only their own document and a Guest needs the view
// token from the redirect.
export function canView(
  doc: { userId?: unknown; viewToken?: string },
  userId: string | null,
  token: string | undefined,
): boolean {
  if (userId !== null) return String(doc.userId) === userId;
  return tokenMatches(doc.viewToken, token);
}
