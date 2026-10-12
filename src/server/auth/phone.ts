export function normalizePhone(raw: string): string {
  const s = raw.trim();
  return (s.startsWith("+") ? "+" : "") + s.replace(/\D/g, "");
}
