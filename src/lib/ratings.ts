/** Star selected after a key press in a 1-5 radiogroup; null when the key is not handled. */
export function starForKey(key: string, value: number): number | null {
  if (key === "Home") return 1;
  if (key === "End") return 5;
  const step =
    key === "ArrowRight" || key === "ArrowUp"
      ? 1
      : key === "ArrowLeft" || key === "ArrowDown"
        ? -1
        : 0;
  return step ? Math.min(5, Math.max(1, value + step)) : null;
}

export function roundRating(value: number): number {
  return Math.round(value * 10) / 10;
}
