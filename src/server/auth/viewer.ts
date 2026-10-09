import type { Viewer } from "@/lib/viewer";
import type { SessionInfo } from "@/server/auth/session-store";
import { favoriteDishIds } from "@/server/favorites";

export async function buildViewer(session: SessionInfo | null): Promise<Viewer> {
  if (!session) return { role: "guest", favoriteIds: [] };
  const { role, id } = session.user;
  return { role, favoriteIds: role === "user" ? await favoriteDishIds(id) : [] };
}
