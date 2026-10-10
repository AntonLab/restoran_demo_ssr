// Props cross the server/client boundary, so ids are an array, not a Set.
// cartQty: Dish id to Cart quantity; empty for Admin.
export type Viewer = {
  role: "guest" | "user" | "admin";
  favoriteIds: string[];
  cartQty: Record<string, number>;
};
