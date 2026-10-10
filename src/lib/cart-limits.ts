export const MAX_QTY = 20;
export const MAX_LINES = 30;

export function clampQty(qty: number): number {
  if (Number.isNaN(qty)) return 0;
  return Math.min(MAX_QTY, Math.max(0, Math.floor(qty)));
}
