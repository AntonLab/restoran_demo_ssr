import Image from "next/image";
import { FavoriteButton } from "@/components/menu/favorite-button";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { Viewer } from "@/lib/viewer";
import type { DishDetail } from "@/server/queries/menu";

export function DishDetailView({ dish, viewer }: { dish: DishDetail; viewer: Viewer }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Image
        src={"/images/" + dish.imageMedium}
        width={900}
        height={675}
        unoptimized
        priority
        alt={dish.name}
        className="h-auto w-full rounded-xl"
      />
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">{dish.name}</h1>
        <p className="whitespace-pre-line text-muted-foreground">{dish.fullDescription}</p>
        {dish.ingredients.length > 0 && (
          <section>
            <h2 className="mb-1 font-semibold">Ingredients</h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {dish.ingredients.map((ingredient) => (
                <li key={ingredient}>{ingredient}</li>
              ))}
            </ul>
          </section>
        )}
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Weight</dt>
          <dd>{dish.weight}</dd>
          <dt className="text-muted-foreground">Price</dt>
          <dd className="font-semibold text-primary">{formatPrice(dish.priceCents)}</dd>
          <dt className="text-muted-foreground">Availability</dt>
          <dd>{dish.inStock ? "In stock" : "Out of stock"}</dd>
        </dl>
        <FavoriteButton dishId={dish.id} count={dish.favoritesCount} viewer={viewer} />
        <div className="flex items-center gap-2">
          <Button disabled size="sm">
            Add to cart
          </Button>
          <span className="text-xs text-muted-foreground">Coming soon</span>
        </div>
      </div>
    </div>
  );
}
