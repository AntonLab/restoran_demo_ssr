// A client can send any x-forwarded-for, and Next keeps a client-sent value over the socket
// address. Without a trusted proxy we ignore the header: the demo runs locally for one person,
// so one shared "local" bucket is correct, and a forged header cannot dodge rate limits.
// TRUST_PROXY=N counts proxy hops; the entry N from the end is what the outermost one saw.
export function clientIp(h: { get(name: string): string | null }): string {
  const hops = Number(process.env.TRUST_PROXY);
  if (!Number.isInteger(hops) || hops < 1) return "local";
  const entries = (h.get("x-forwarded-for") ?? "").split(",").map((e) => e.trim());
  return entries[entries.length - hops] || "local";
}
