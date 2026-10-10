import { cookies } from "next/headers";
import { mergeGuestCart } from "@/server/cart";
import { CART_COOKIE, parseCid } from "@/server/auth/shopper";
import { attachGuestOrders } from "@/server/orders";

// Neither hook may throw: the Session already exists, and a thrown error
// would leave a signed-in user on an error page.

export async function afterSignIn(userId: string, role: "user" | "admin"): Promise<void> {
  if (role !== "user") return;
  try {
    const store = await cookies();
    const raw = store.get(CART_COOKIE)?.value;
    if (raw === undefined) return;
    const cid = parseCid(raw);
    try {
      if (cid) await mergeGuestCart(cid, userId);
    } catch {
      console.error("Cart merge failed");
    }
    // Deleted even when the merge failed: a stuck cookie would retry it at every sign-in.
    store.delete(CART_COOKIE);
  } catch {
    console.error("Guest Cart cookie handling failed");
  }
}

export async function afterRegister(userId: string, phone: string): Promise<void> {
  try {
    await attachGuestOrders(userId, phone);
  } catch {
    console.error("Guest Order attach failed");
  }
  await afterSignIn(userId, "user");
}
