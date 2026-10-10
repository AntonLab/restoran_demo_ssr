// At most 9 digits keeps the value a safe integer for the Mongo query.
export function parseOrderNumber(raw: string | string[] | undefined): number | null {
  return typeof raw === "string" && /^[1-9]\d{0,8}$/.test(raw) ? Number(raw) : null;
}
