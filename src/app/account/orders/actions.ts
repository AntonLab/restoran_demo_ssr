"use server";

import { revalidatePath } from "next/cache";
import { actionUser } from "@/server/auth/guards";
import { cancelUserOrder, type CancelResult } from "@/server/orders";

export async function cancelOrderAction(number: number): Promise<CancelResult> {
  const session = await actionUser();
  if (!session) return { ok: false, error: "Sign in as a user to do this." };
  const result = await cancelUserOrder(session.user.id, number);
  // A failure with a status means the table shows a stale one.
  if (result.ok || result.status) revalidatePath("/account/orders");
  return result;
}
