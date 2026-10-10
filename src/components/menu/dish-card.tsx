import Image from "next/image";
import Link from "next/link";
import { AddToCart } from "@/components/menu/add-to-cart";
import { FavoriteButton } from "@/components/menu/favorite-button";
import { formatPrice } from "@/lib/format";
import type { Viewer } from "@/lib/viewer";
import type { DishCardData } from "@/server/queries/menu";

export function DishCard({
  dish,
  viewer,
  eager = false,
}: {
  dish: DishCardData;
  viewer: Viewer;
  eager?: boolean;
}) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground">
      <Image
        src={"/images/" + dish.imageSmall}
        width={400}
        height={300}
        unoptimized
        loading={eager ? "eager" : "lazy"}
        alt={dish.name}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="font-semibold">
          <Link
            href={`/menu/dish/${dish.id}`}
            scroll={false}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-inset focus-visible:after:ring-ring/50"
          >
            {dish.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{dish.shortDescription}</p>
        <p className="text-xs text-muted-foreground">{dish.weight}</p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="font-semibold text-primary">{formatPrice(dish.priceCents)}</span>
          {!dish.inStock && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Out of stock</span>
          )}
          <FavoriteButton dishId={dish.id} count={dish.favoritesCount} viewer={viewer} />
        </div>
        <AddToCart dishId={dish.id} name={dish.name} inStock={dish.inStock} viewer={viewer} />
      </div>
    </article>
  );
}
