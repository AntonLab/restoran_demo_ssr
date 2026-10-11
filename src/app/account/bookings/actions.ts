"use server";

import { revalidatePath } from "next/cache";
import { actionUser } from "@/server/auth/guards";
import { cancelUserBooking, type BookingCancelResult } from "@/server/bookings";

export async function cancelBookingAction(number: number): Promise<BookingCancelResult> {
  const session = await actionUser();
  if (!session) return { ok: false, error: "Sign in as a user to do this." };
  const result = await cancelUserBooking(session.user.id, number);
  // Revalidate on a failure that returned a status: the list's row is stale.
  if (result.ok || result.status) revalidatePath("/account/bookings");
  return result;
}
