// A repeated query parameter arrives as an array; treat it as absent.
export function singleParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}
