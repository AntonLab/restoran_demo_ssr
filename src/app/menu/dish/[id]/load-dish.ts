import { connection } from "next/server";
import { getDishDetail } from "@/server/queries/menu";

export async function loadDish(params: Promise<{ id: string }>) {
  await connection();
  return getDishDetail((await params).id);
}
