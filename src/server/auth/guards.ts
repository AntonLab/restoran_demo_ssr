import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import type { SessionInfo } from "@/server/auth/session-store";

type Access = { ok: true; session: SessionInfo } | { ok: false; redirectTo: string };

export function checkAccess(
  session: SessionInfo | null,
  area: "user" | "admin",
  next: string,
): Access {
  if (!session) return { ok: false, redirectTo: `/login?next=${encodeURIComponent(next)}` };
  if (area === "user" && session.user.role === "admin") return { ok: false, redirectTo: "/admin" };
  if (area === "admin" && session.user.role === "user") return { ok: false, redirectTo: "/" };
  return { ok: true, session };
}

async function guard(area: "user" | "admin", next: string): Promise<SessionInfo> {
  const access = checkAccess(await getSession(), area, next);
  if (!access.ok) redirect(access.redirectTo);
  return access.session;
}

export const requireUser = (next: string) => guard("user", next);
export const requireAdmin = (next: string) => guard("admin", next);

// Server Actions return an error instead of redirecting.
export async function actionUser(): Promise<SessionInfo | null> {
  const session = await getSession();
  return session?.user.role === "user" ? session : null;
}
