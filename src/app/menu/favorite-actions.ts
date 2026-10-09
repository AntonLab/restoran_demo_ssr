"use server";

import { revalidatePath } from "next/cache";
import { actionUser } from "@/server/auth/guards";
import { type FavoriteResult, toggleFavorite } from "@/server/favorites";

export async function toggleFavoriteAction(dishId: string): Promise<FavoriteResult> {
  const session = await actionUser();
  if (!session) return { ok: false, error: "Sign in to save favorites." };
  const result = await toggleFavorite(session.user.id, dishId);
  // Counts show on Home, Menu and the Dish pages; /account/favorites lists the marks.
  if (result.ok) revalidatePath("/", "layout");
  return result;
}
