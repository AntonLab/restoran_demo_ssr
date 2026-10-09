// Props cross the server/client boundary, so ids are an array, not a Set.
export type Viewer = { role: "guest" | "user" | "admin"; favoriteIds: string[] };
