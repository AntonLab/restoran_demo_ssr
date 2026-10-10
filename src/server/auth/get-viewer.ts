import { cookies } from "next/headers";
import type { Viewer } from "@/lib/viewer";
import { getSession } from "@/server/auth/session";
import { CART_COOKIE } from "@/server/auth/shopper";
import { buildViewer } from "@/server/auth/viewer";

// Separate from viewer.ts so the test can import buildViewer without the cookie-reading session module.
export async function getViewer(): Promise<Viewer> {
  return buildViewer(await getSession(), (await cookies()).get(CART_COOKIE)?.value);
}
