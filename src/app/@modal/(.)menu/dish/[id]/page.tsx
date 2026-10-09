import { notFound } from "next/navigation";
import { connection } from "next/server";
import { DishDetailView } from "@/components/menu/dish-detail-view";
import { DishModal } from "@/components/menu/dish-modal";
import { getDishDetail } from "@/server/queries/menu";

export default async function Page({ params }: PageProps<"/menu/dish/[id]">) {
  await connection();
  const dish = await getDishDetail((await params).id);
  if (!dish) notFound();
  return (
    <DishModal label={dish.name}>
      <DishDetailView dish={dish} />
    </DishModal>
  );
}
