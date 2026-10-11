"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIp } from "@/lib/client-ip";
import { getShopper } from "@/server/auth/shopper-cookie";
import { toOrderContext } from "@/server/auth/shopper";
import { placeBooking } from "@/server/bookings";
import type { FieldErrors } from "@/server/feedback";

export type BookingFormState =
  | { status: "idle" }
  | { status: "error"; error: string; fieldErrors?: FieldErrors };

export async function bookingAction(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const shopper = await getShopper();
  if (!shopper) return { status: "error", error: "Admins cannot book a table." };
  const result = await placeBooking(
    Object.fromEntries(formData),
    toOrderContext(shopper, clientIp(await headers())),
  );
  if (!result.ok) return { status: "error", error: result.error, fieldErrors: result.fieldErrors };
  // A Pre-order empties the Cart; see cart/actions.ts.
  revalidatePath("/", "layout");
  redirect(`/booking/done?number=${result.number}&t=${result.token}`);
}
