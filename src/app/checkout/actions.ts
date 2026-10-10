"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIp } from "@/lib/client-ip";
import { getShopper } from "@/server/auth/shopper-cookie";
import { toOrderContext } from "@/server/auth/shopper";
import type { FieldErrors } from "@/server/feedback";
import { placeOrder } from "@/server/orders";

export type CheckoutFormState =
  | { status: "idle" }
  | { status: "error"; error: string; fieldErrors?: FieldErrors };

export async function checkoutAction(
  _prev: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const shopper = await getShopper();
  if (!shopper) return { status: "error", error: "Admins cannot place orders." };
  const result = await placeOrder(
    Object.fromEntries(formData),
    toOrderContext(shopper, clientIp(await headers())),
  );
  if (!result.ok) return { status: "error", error: result.error, fieldErrors: result.fieldErrors };
  // Order emptied the Cart; see cart/actions.ts.
  revalidatePath("/", "layout");
  redirect(`/checkout/done?number=${result.number}`);
}
