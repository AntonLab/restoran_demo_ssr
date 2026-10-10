// Props cross the server/client boundary, so ids are an array, not a Set.
// cartQty maps Dish id to Cart quantity; an Admin has no Cart.
export type Viewer = {
  role: "guest" | "user" | "admin";
  favoriteIds: string[];
  cartQty: Record<string, number>;
};
