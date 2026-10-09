import { cache } from "react";
import { cookies } from "next/headers";
import {
  createSessionRecord,
  deleteSessionByToken,
  findSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/server/auth/session-store";

// Cookie writes only work in Server Actions and Route Handlers, never while rendering.
export async function createSession(userId: string): Promise<void> {
  const { token, expiresAt } = await createSessionRecord(userId);
  (await cookies()).set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions(process.env.NODE_ENV === "production", expiresAt),
  );
}

// cache(): layout, page and guards share one lookup per request.
export const getSession = cache(async () =>
  findSession((await cookies()).get(SESSION_COOKIE)?.value),
);

export async function revokeSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await deleteSessionByToken(token);
  store.delete(SESSION_COOKIE);
}
