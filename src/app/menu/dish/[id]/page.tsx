import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDish } from "@/app/menu/dish/[id]/load-dish";
import { DishDetailView } from "@/components/menu/dish-detail-view";

export async function generateMetadata({
  params,
}: PageProps<"/menu/dish/[id]">): Promise<Metadata> {
  const dish = await loadDish(params);
  return { title: dish ? dish.name : "Dish not found" };
}

export default async function Page({ params }: PageProps<"/menu/dish/[id]">) {
  const dish = await loadDish(params);
  if (!dish) notFound();
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      <Link
        href="/menu"
        className="mb-4 inline-block rounded-md text-sm text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        Back to menu
      </Link>
      <DishDetailView dish={dish} />
    </div>
  );
}
