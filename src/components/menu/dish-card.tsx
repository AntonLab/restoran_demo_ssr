import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { DishCardData } from "@/server/queries/menu";

export function DishCard({ dish, eager = false }: { dish: DishCardData; eager?: boolean }) {
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
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Heart aria-hidden className="size-4" />
            <span aria-hidden>{dish.favoritesCount}</span>
            <span className="sr-only">{dish.favoritesCount} favorites</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled size="sm">
            Add to cart
          </Button>
          <span className="text-xs text-muted-foreground">Coming soon</span>
        </div>
      </div>
    </article>
  );
}
