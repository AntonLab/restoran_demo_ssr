import { notFound } from "next/navigation";
import { loadDish } from "@/app/menu/dish/[id]/load-dish";
import { DishDetailView } from "@/components/menu/dish-detail-view";
import { DishModal } from "@/components/menu/dish-modal";
import { getViewer } from "@/server/auth/get-viewer";

export default async function Page({ params }: PageProps<"/menu/dish/[id]">) {
  const [dish, viewer] = await Promise.all([loadDish(params), getViewer()]);
  if (!dish) notFound();
  return (
    <DishModal label={dish.name}>
      <DishDetailView dish={dish} viewer={viewer} />
    </DishModal>
  );
}
