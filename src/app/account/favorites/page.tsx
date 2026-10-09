import type { Metadata } from "next";
import Link from "next/link";
import { AccountNav } from "@/components/account/account-nav";
import { DishCard } from "@/components/menu/dish-card";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/server/auth/guards";
import { buildViewer } from "@/server/auth/viewer";
import { listFavoriteDishes } from "@/server/favorites";

export const metadata: Metadata = { title: "Favorites" };

export default async function Page() {
  const session = await requireUser("/account/favorites");
  const [dishes, viewer] = await Promise.all([
    listFavoriteDishes(session.user.id),
    buildViewer(session),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Account</h1>
      <AccountNav />
      {dishes.length === 0 ? (
        <div className="mt-6 flex flex-col items-start gap-3">
          <h2 className="text-xl font-semibold">No favorites yet</h2>
          <Link href="/menu" className={buttonVariants({ variant: "outline" })}>
            Browse the menu
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dishes.map((dish, i) => (
            <li key={dish.id}>
              <DishCard dish={dish} viewer={viewer} eager={i === 0} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
