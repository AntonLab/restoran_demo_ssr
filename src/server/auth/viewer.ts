import type { Viewer } from "@/lib/viewer";
import { resolveShopper } from "@/server/auth/shopper";
import type { SessionInfo } from "@/server/auth/session-store";
import { cartQuantities } from "@/server/cart";
import { favoriteDishIds } from "@/server/favorites";

export async function buildViewer(
  session: SessionInfo | null,
  rawCid?: string | null,
): Promise<Viewer> {
  const ownerKey = resolveShopper(session, rawCid)?.ownerKey;
  const cartQty = ownerKey ? await cartQuantities(ownerKey) : {};
  if (!session) return { role: "guest", favoriteIds: [], cartQty };
  const { role, id } = session.user;
  return { role, favoriteIds: role === "user" ? await favoriteDishIds(id) : [], cartQty };
}
