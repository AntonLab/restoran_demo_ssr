export const ORDER_STATUSES = ["new", "accepted", "delivery", "completed", "cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  accepted: "Accepted",
  delivery: "Delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

const NEXT: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ["accepted", "cancelled"],
  accepted: ["delivery", "cancelled"],
  delivery: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT[from].includes(to);
}

export function canUserCancel(status: OrderStatus): boolean {
  return status === "new";
}
