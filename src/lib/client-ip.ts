// Behind no proxy the header is absent: all such callers share one rate-limit bucket.
export function clientIp(h: { get(name: string): string | null }): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
